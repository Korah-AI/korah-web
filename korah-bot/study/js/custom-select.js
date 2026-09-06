/* Custom select — see custom-select.css.
   Wires the .ks-select markup: clicking the trigger opens the panel, clicking a
   row writes the value into the hidden input and fires a bubbling `change` on
   it, so code that used to listen to the native <select> keeps working. */
(function () {
  function wire(root) {
    var trigger = root.querySelector(".ks-trigger");
    var menu = root.querySelector(".ks-menu");
    var hidden = root.querySelector("input[type=hidden]");
    var label = root.querySelector(".ks-trigger-label");
    if (!trigger || !menu || !hidden) return;

    var options = menu.querySelectorAll(".create-dropdown-item");

    function close() {
      menu.classList.remove("open");
      trigger.classList.remove("open");
      trigger.setAttribute("aria-expanded", "false");
    }
    function open() {
      closeAll(root);
      menu.classList.add("open");
      trigger.classList.add("open");
      trigger.setAttribute("aria-expanded", "true");
    }

    function select(btn, silent) {
      var value = btn.getAttribute("data-value");
      var name = btn.querySelector(".dropdown-item-name");
      var tone = btn.getAttribute("data-tone");
      hidden.value = value;
      if (label) label.textContent = name ? name.textContent : btn.textContent.trim();
      options.forEach(function (o) { o.classList.toggle("is-selected", o === btn); });
      // A chosen option fills the trigger in that option's tone; the rows that
      // mean "no filter" carry no tone and leave it grey.
      if (tone) trigger.setAttribute("data-tone", tone);
      else trigger.removeAttribute("data-tone");
      if (!silent) hidden.dispatchEvent(new Event("change", { bubbles: true }));
    }

    trigger.setAttribute("aria-haspopup", "listbox");
    trigger.setAttribute("aria-expanded", "false");
    trigger.addEventListener("click", function (e) {
      e.stopPropagation();
      if (menu.classList.contains("open")) close(); else open();
    });
    options.forEach(function (btn) {
      btn.addEventListener("click", function (e) {
        e.stopPropagation();
        select(btn, false);
        close();
        trigger.focus();
      });
    });
    root._ksClose = close;

    // Show whichever row matches the value the markup started with.
    var initial = null;
    options.forEach(function (btn) {
      if (btn.getAttribute("data-value") === hidden.value) initial = btn;
    });
    if (initial) select(initial, true);

    // Pages that reset a field from script call KorahSelect.set(); the label
    // has to follow the value.
    root._ksSet = function (value) {
      options.forEach(function (btn) {
        if (btn.getAttribute("data-value") === value) select(btn, true);
      });
    };
    root.dataset.ksReady = "true";
  }

  // One pair of document listeners for every select on the page: test-create.html
  // re-renders its question cards on each change, so per-root listeners would
  // pile up.
  function closeAll(except) {
    document.querySelectorAll("[data-ks-select]").forEach(function (root) {
      if (root !== except && root._ksClose) root._ksClose();
    });
  }
  document.addEventListener("click", function (e) {
    var inside = e.target.closest && e.target.closest("[data-ks-select]");
    closeAll(inside);
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") closeAll(null);
  });

  function upgrade(root) {
    (root || document).querySelectorAll("[data-ks-select]:not([data-ks-ready])").forEach(wire);
  }

  function set(input, value) {
    var root = input && input.closest("[data-ks-select]");
    if (root && root._ksSet) root._ksSet(value);
    else if (input) input.value = value;
  }

  window.KorahSelect = { upgrade: upgrade, set: set };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () { upgrade(document); });
  } else {
    upgrade(document);
  }
})();
