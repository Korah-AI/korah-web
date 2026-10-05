#!/usr/bin/env python3
"""Virtual camera over a screen recording, for the landing page demo clips.

Crops browser chrome off a raw QuickTime capture, then flies a keyframed
zoom/pan across it so the shot pushes in on whatever the cursor is doing.
Rendered per frame with PIL because ffmpeg's crop cannot animate w/h and
zoompan does not ease cleanly.

  sheet   tile frames every --every seconds into labelled contact sheets, to
          find the beats (also works on a render, to review it)
  probe   dump a frame with a coordinate grid, to read target centres off
  keyed   render a camera path: "t,cx,cy,zoom" keys, smoothstep between them
  follow  render a damped auto-follow of the motion centroid (first pass only,
          it drifts near frame edges because it tracks pixels, not meaning)

Camera coordinates are in the cropped frame, not the original capture.
--aspect sets the output shape when it should differ from the crop's, zoom 1
being the largest window of that shape that fits inside the crop.
--segs keeps only the listed "start,end,speed" spans of the capture, each played
at its speed and joined with hard cuts. Key times stay in capture seconds and
are mapped through the edit, so a key pinned to a beat stays on it when a
speed changes. A key inside a cut lands on the cut.

  python3 demo-camera.py sheet cap.mov --crop 0,160,2560,1600 --every 1
  python3 demo-camera.py probe cap.mov --crop 0,160,2560,1600 --at 3.2
  python3 demo-camera.py keyed cap.mov out.mp4 --crop 0,160,2560,1600 \
      --keys "0,1280,800,1; 0.6,1280,800,1; 1.9,1200,475,2.2; 4,890,990,2.6"
  python3 demo-camera.py keyed cap.mov out.mp4 --crop 0,160,2560,1600 \
      --segs "1,7,1.5; 12,14,1; 30,40,1.2" --keys "1,1280,800,1; 3,1200,475,2"
  python3 demo-camera.py follow cap.mov out.mp4 --crop 0,160,2560,1600 --zoom 2.2
"""
import argparse, subprocess, sys
import numpy as np
from PIL import Image, ImageDraw
from scipy.ndimage import gaussian_filter1d


def probe_src(path):
    r = subprocess.run(["ffprobe", "-v", "error", "-select_streams", "v:0",
        "-show_entries", "stream=width,height,r_frame_rate", "-of", "csv=p=0", path],
        capture_output=True, text=True).stdout.strip().split(",")
    n, d = r[2].split("/")
    return int(r[0]), int(r[1]), int(round(int(n) / int(d)))


def decode(path, crop, scale=None, segs=None, fps=None):
    vf = f"crop={crop[2]}:{crop[3]}:{crop[0]}:{crop[1]}"
    if segs:
        n = len(segs)
        vf += f",split={n}" + "".join(f"[s{i}]" for i in range(n)) + ";"
        vf += "".join(f"[s{i}]trim=start={a}:end={b},setpts=(PTS-STARTPTS)/{v},fps={fps}[v{i}];"
                      for i, (a, b, v) in enumerate(segs))
        vf += "".join(f"[v{i}]" for i in range(n)) + f"concat=n={n}"
    if scale:
        vf += f",scale={scale[0]}:{scale[1]}"
    return ["ffmpeg", "-v", "error", "-i", path, "-filter_complex" if segs else "-vf", vf,
            "-f", "rawvideo", "-pix_fmt", "rgb24", "-"]


def remap(t, segs):
    """Capture time to output time, once only the segs are kept."""
    return sum(max(0.0, min(t, b) - a) / v for a, b, v in segs) if segs else t


def motion_path(path, crop, fps, segs):
    """Centroid of frame-to-frame change, which is the cursor and the typing."""
    sw, sh = 640, round(640 * crop[3] / crop[2] / 2) * 2
    raw = subprocess.run(decode(path, crop, (sw, sh), segs, fps), capture_output=True).stdout
    f = np.frombuffer(raw, np.uint8).reshape(-1, sh, sw, 3).astype(np.int16)
    cx = np.full(len(f), crop[2] / 2)
    cy = np.full(len(f), crop[3] / 2)
    for i in range(1, len(f)):
        m = np.abs(f[i] - f[i - 1]).sum(2) > 40
        if m.sum() < 8:
            cx[i], cy[i] = cx[i - 1], cy[i - 1]
        else:
            ys, xs = np.nonzero(m)
            cx[i] = xs.mean() / sw * crop[2]
            cy[i] = ys.mean() / sh * crop[3]
    s = fps * 0.35
    return list(zip(gaussian_filter1d(cx, s), gaussian_filter1d(cy, s)))


def keyed_path(keys, n, fps):
    out = []
    for i in range(n):
        t = i / fps
        a, b = keys[0], keys[-1]
        for j in range(len(keys) - 1):
            if keys[j][0] <= t <= keys[j + 1][0]:
                a, b = keys[j], keys[j + 1]
                break
        p = min(max((t - a[0]) / ((b[0] - a[0]) or 1), 0.0), 1.0)
        e = p * p * (3 - 2 * p)
        out.append(tuple(a[k + 1] + (b[k + 1] - a[k + 1]) * e for k in range(3)))
    return out


def render(path, crop, fps, dst, path_fn, ow, aspect, segs):
    cw_src, ch_src = crop[2], crop[3]
    oh = round(ow / aspect / 2) * 2
    bw, bh = min(cw_src, ch_src * aspect), min(ch_src, cw_src / aspect)
    dec = subprocess.Popen(decode(path, crop, None, segs, fps), stdout=subprocess.PIPE)
    enc = subprocess.Popen(["ffmpeg", "-y", "-v", "error", "-f", "rawvideo",
        "-pix_fmt", "rgb24", "-s", f"{ow}x{oh}", "-r", str(fps), "-i", "-",
        "-c:v", "libx264", "-crf", "23", "-pix_fmt", "yuv420p",
        "-movflags", "+faststart", dst], stdin=subprocess.PIPE)
    n = 0
    while True:
        buf = dec.stdout.read(cw_src * ch_src * 3)
        if len(buf) < cw_src * ch_src * 3:
            break
        cx, cy, z = path_fn(n)
        w, h = bw / z, bh / z
        x = min(max(cx - w / 2, 0), cw_src - w)
        y = min(max(cy - h / 2, 0), ch_src - h)
        if w < ow:
            print(f"warn: frame {n} crops to {w:.0f}px for a {ow}px output, text will soften",
                  file=sys.stderr)
        im = Image.frombuffer("RGB", (cw_src, ch_src), buf)
        enc.stdin.write(im.resize((ow, oh), Image.LANCZOS, box=(x, y, x + w, y + h)).tobytes())
        n += 1
    enc.stdin.close()
    enc.wait()
    dec.wait()
    print(f"{dst}: {n} frames at {ow}x{oh}")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("mode", choices=["sheet", "probe", "keyed", "follow"])
    ap.add_argument("src")
    ap.add_argument("dst", nargs="?")
    ap.add_argument("--crop", help="x,y,w,h of the app panel in the capture")
    ap.add_argument("--keys", help='"t,cx,cy,zoom; ..." camera keyframes')
    ap.add_argument("--zoom", type=float, default=2.2, help="follow mode zoom")
    ap.add_argument("--at", type=float, default=0.0, help="probe timestamp, sheet start")
    ap.add_argument("--to", type=float, help="sheet end, defaults to the end of the capture")
    ap.add_argument("--every", type=float, default=1.0, help="sheet spacing in seconds")
    ap.add_argument("--segs", help='"start,end,speed; ..." spans of the capture to keep')
    ap.add_argument("--width", type=int, default=1280, help="output width")
    ap.add_argument("--aspect", help='output "w:h", defaults to the crop\'s')
    a = ap.parse_args()

    W, H, fps = probe_src(a.src)
    crop = [int(v) for v in a.crop.split(",")] if a.crop else [0, 0, W, H]

    if a.mode == "sheet":
        tw, th = 640, round(640 * crop[3] / crop[2])
        span = ["-ss", str(a.at)] + (["-to", str(a.to)] if a.to else [])
        raw = subprocess.run(["ffmpeg", "-v", "error", *span, "-i", a.src, "-vf",
            f"crop={crop[2]}:{crop[3]}:{crop[0]}:{crop[1]},fps=1/{a.every},scale={tw}:{th}",
            "-f", "rawvideo", "-pix_fmt", "rgb24", "-"], capture_output=True).stdout
        size, k = tw * th * 3, tw / crop[2]
        frames = [Image.frombuffer("RGB", (tw, th), raw[i:i + size]).copy()
                  for i in range(0, len(raw) - size + 1, size)]
        for g in range(0, len(frames), 16):
            out = Image.new("RGB", (tw * 4, th * 4))
            for j, im in enumerate(frames[g:g + 16]):
                d = ImageDraw.Draw(im)
                for x in range(400, crop[2], 400):
                    d.line([(x * k, 0), (x * k, th)], fill=(255, 0, 128))
                    d.text((x * k + 3, th - 14), str(x), fill=(255, 0, 128))
                for y in range(400, crop[3], 400):
                    d.line([(0, y * k), (tw, y * k)], fill=(255, 0, 128))
                    d.text((3, y * k + 3), str(y), fill=(255, 0, 128))
                d.rectangle([0, 0, 70, 16], fill=(255, 0, 0))
                d.text((4, 3), f"t={a.at + (g + j) * a.every:.2f}", fill=(255, 255, 255))
                out.paste(im, ((j % 4) * tw, (j // 4) * th))
            name = f"sheet-{a.at}-{g // 16}.png"
            out.save(name)
            print(name)
        return

    if a.mode == "probe":
        raw = subprocess.run(["ffmpeg", "-v", "error", "-ss", str(a.at), "-i", a.src,
            "-vf", f"crop={crop[2]}:{crop[3]}:{crop[0]}:{crop[1]}", "-frames:v", "1",
            "-f", "rawvideo", "-pix_fmt", "rgb24", "-"], capture_output=True).stdout
        im = Image.frombuffer("RGB", (crop[2], crop[3]), raw)
        d = ImageDraw.Draw(im)
        for x in range(0, crop[2], 200):
            d.line([(x, 0), (x, crop[3])], fill=(255, 0, 128), width=2)
            d.text((x + 6, 6), str(x), fill=(255, 0, 128))
        for y in range(0, crop[3], 200):
            d.line([(0, y), (crop[2], y)], fill=(255, 0, 128), width=2)
            d.text((6, y + 6), str(y), fill=(255, 0, 128))
        out = f"probe-{a.at}.png"
        im.save(out)
        print(f"{out}  source {W}x{H} @ {fps}fps  crop {crop}")
        return

    segs = [tuple(float(v) for v in s.split(",")) for s in a.segs.split(";")] if a.segs else None
    if segs:
        frames = round(remap(float("inf"), segs) * fps) + 1
    else:
        frames = int(subprocess.run(["ffprobe", "-v", "error",
            "-select_streams", "v:0", "-count_frames", "-show_entries", "stream=nb_read_frames",
            "-of", "csv=p=0", a.src], capture_output=True, text=True).stdout.strip())

    if a.mode == "keyed":
        keys = [tuple(float(v) for v in k.split(",")) for k in a.keys.split(";")]
        keys = [(remap(k[0], segs), *k[1:]) for k in keys]
        p = keyed_path(keys, frames, fps)
        fn = lambda n: p[min(n, len(p) - 1)]
    else:
        p = motion_path(a.src, crop, fps, segs)
        fn = lambda n: (*p[min(n, len(p) - 1)], a.zoom)

    aw, ah = (float(v) for v in a.aspect.split(":")) if a.aspect else crop[2:]
    render(a.src, crop, fps, a.dst, fn, a.width, aw / ah, segs)


main()
