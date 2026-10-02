#!/usr/bin/env python3
"""Virtual camera over a screen recording, for the landing page demo clips.

Crops browser chrome off a raw QuickTime capture, then flies a keyframed
zoom/pan across it so the shot pushes in on whatever the cursor is doing.
Rendered per frame with PIL because ffmpeg's crop cannot animate w/h and
zoompan does not ease cleanly.

  probe   dump a frame with a coordinate grid, to read target centres off
  keyed   render a camera path: "t,cx,cy,zoom" keys, smoothstep between them
  follow  render a damped auto-follow of the motion centroid (first pass only,
          it drifts near frame edges because it tracks pixels, not meaning)

Camera coordinates are in the cropped frame, not the original capture.

  python3 demo-camera.py probe cap.mov --crop 0,160,2560,1600 --at 3.2
  python3 demo-camera.py keyed cap.mov out.mp4 --crop 0,160,2560,1600 \
      --keys "0,1280,800,1; 0.6,1280,800,1; 1.9,1200,475,2.2; 4,890,990,2.6"
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


def decode(path, crop, scale=None):
    vf = f"crop={crop[2]}:{crop[3]}:{crop[0]}:{crop[1]}"
    if scale:
        vf += f",scale={scale[0]}:{scale[1]}"
    return ["ffmpeg", "-v", "error", "-i", path, "-vf", vf,
            "-f", "rawvideo", "-pix_fmt", "rgb24", "-"]


def motion_path(path, crop, fps):
    """Centroid of frame-to-frame change, which is the cursor and the typing."""
    sw, sh = 640, round(640 * crop[3] / crop[2] / 2) * 2
    raw = subprocess.run(decode(path, crop, (sw, sh)), capture_output=True).stdout
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


def render(path, crop, fps, dst, path_fn, ow):
    cw_src, ch_src = crop[2], crop[3]
    oh = round(ow * ch_src / cw_src / 2) * 2
    dec = subprocess.Popen(decode(path, crop), stdout=subprocess.PIPE)
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
        w, h = cw_src / z, ch_src / z
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
    ap.add_argument("mode", choices=["probe", "keyed", "follow"])
    ap.add_argument("src")
    ap.add_argument("dst", nargs="?")
    ap.add_argument("--crop", help="x,y,w,h of the app panel in the capture")
    ap.add_argument("--keys", help='"t,cx,cy,zoom; ..." camera keyframes')
    ap.add_argument("--zoom", type=float, default=2.2, help="follow mode zoom")
    ap.add_argument("--at", type=float, default=0.0, help="probe timestamp")
    ap.add_argument("--width", type=int, default=1280, help="output width")
    a = ap.parse_args()

    W, H, fps = probe_src(a.src)
    crop = [int(v) for v in a.crop.split(",")] if a.crop else [0, 0, W, H]

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

    frames = probe_src(a.src) and int(subprocess.run(["ffprobe", "-v", "error",
        "-select_streams", "v:0", "-count_frames", "-show_entries", "stream=nb_read_frames",
        "-of", "csv=p=0", a.src], capture_output=True, text=True).stdout.strip())

    if a.mode == "keyed":
        keys = [tuple(float(v) for v in k.split(",")) for k in a.keys.split(";")]
        p = keyed_path(keys, frames, fps)
        fn = lambda n: p[min(n, len(p) - 1)]
    else:
        p = motion_path(a.src, crop, fps)
        fn = lambda n: (*p[min(n, len(p) - 1)], a.zoom)

    render(a.src, crop, fps, a.dst, fn, a.width)


main()
