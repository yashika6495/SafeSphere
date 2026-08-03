import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

/**
 * Themed dropdown.
 *
 * A native <select> draws its list with OS chrome that CSS cannot touch,
 * and on macOS it deliberately overlays the trigger so the current value
 * sits under the pointer. Neither is fixable — hence a real listbox.
 *
 * The panel is portalled to <body> and positioned fixed rather than
 * absolutely inside the field: the report form lives in a modal with
 * `overflow-y: auto`, which would clip any child that extended past it.
 *
 * Keyboard: Enter/Space/arrows open, arrows move, Enter picks, Escape
 * closes, Home/End jump, and typing a letter jumps to matching options.
 */
export default function Select({
    id,
    value,
    onChange,
    options,
    placeholder = "Choose one…",
    invalid = false,
}) {
    const [open, setOpen] = useState(false);
    const [active, setActive] = useState(-1);
    const [rect, setRect] = useState(null);

    const triggerRef = useRef(null);
    const panelRef = useRef(null);
    const typed = useRef({ text: "", at: 0 });

    const measure = () => {
        const el = triggerRef.current;
        if (!el) return;

        const r = el.getBoundingClientRect();
        const below = window.innerHeight - r.bottom;
        const needed = Math.min(options.length * 42 + 12, 280);

        // Flip above when there isn't room underneath.
        const dropUp = below < needed + 16 && r.top > below;

        setRect({
            left: r.left,
            width: r.width,
            top: dropUp ? null : r.bottom + 6,
            bottom: dropUp ? window.innerHeight - r.top + 6 : null,
            maxHeight: Math.max(140, (dropUp ? r.top : below) - 22),
        });
    };

    useLayoutEffect(() => {
        if (!open) return;
        measure();

        // `true` for capture: the modal body scrolls, not the window.
        window.addEventListener("scroll", measure, true);
        window.addEventListener("resize", measure);
        return () => {
            window.removeEventListener("scroll", measure, true);
            window.removeEventListener("resize", measure);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, options.length]);

    useEffect(() => {
        if (!open) return;

        const onDown = (e) => {
            if (
                !triggerRef.current?.contains(e.target) &&
                !panelRef.current?.contains(e.target)
            ) {
                setOpen(false);
            }
        };
        document.addEventListener("mousedown", onDown);
        return () => document.removeEventListener("mousedown", onDown);
    }, [open]);

    useEffect(() => {
        if (!open) return;
        panelRef.current
            ?.querySelector("[data-active='true']")
            ?.scrollIntoView({ block: "nearest" });
    }, [open, active]);

    const pick = (option) => {
        onChange(option);
        setOpen(false);
        triggerRef.current?.focus();
    };

    const jumpTo = (char) => {
        const now = Date.now();
        typed.current.text =
            now - typed.current.at > 900 ? char : typed.current.text + char;
        typed.current.at = now;

        const i = options.findIndex((o) =>
            o.toLowerCase().startsWith(typed.current.text)
        );
        if (i >= 0) setActive(i);
    };

    const onKeyDown = (e) => {
        if (!open) {
            if (["Enter", " ", "ArrowDown", "ArrowUp"].includes(e.key)) {
                e.preventDefault();
                setActive(Math.max(0, options.indexOf(value)));
                setOpen(true);
            }
            return;
        }

        switch (e.key) {
            case "Escape":
                e.preventDefault();
                setOpen(false);
                break;
            case "ArrowDown":
                e.preventDefault();
                setActive((a) => (a + 1) % options.length);
                break;
            case "ArrowUp":
                e.preventDefault();
                setActive((a) => (a - 1 + options.length) % options.length);
                break;
            case "Home":
                e.preventDefault();
                setActive(0);
                break;
            case "End":
                e.preventDefault();
                setActive(options.length - 1);
                break;
            case "Enter":
            case " ":
                e.preventDefault();
                if (active >= 0) pick(options[active]);
                break;
            case "Tab":
                setOpen(false);
                break;
            default:
                if (e.key.length === 1 && /\S/.test(e.key)) jumpTo(e.key.toLowerCase());
        }
    };

    return (
        <>
            <button
                id={id}
                type="button"
                ref={triggerRef}
                className={`gg-sel-trigger${open ? " is-open" : ""}${
                    invalid ? " is-invalid" : ""
                }`}
                onClick={() => {
                    setActive(Math.max(0, options.indexOf(value)));
                    setOpen((o) => !o);
                }}
                onKeyDown={onKeyDown}
                role="combobox"
                aria-expanded={open}
                aria-haspopup="listbox"
                aria-controls={open ? `${id}-listbox` : undefined}
            >
                <span className={value ? "" : "gg-sel-placeholder"}>
                    {value || placeholder}
                </span>
                <i className="gg-sel-chevron" aria-hidden="true" />
            </button>

            {open &&
                rect &&
                createPortal(
                    <ul
                        id={`${id}-listbox`}
                        ref={panelRef}
                        className="gg-sel-panel"
                        role="listbox"
                        style={{
                            left: rect.left,
                            width: rect.width,
                            ...(rect.top !== null
                                ? { top: rect.top }
                                : { bottom: rect.bottom }),
                            maxHeight: rect.maxHeight,
                        }}
                    >
                        {options.map((option, i) => (
                            <li key={option}>
                                <button
                                    type="button"
                                    role="option"
                                    aria-selected={option === value}
                                    data-active={i === active}
                                    className={`gg-sel-option${
                                        i === active ? " is-active" : ""
                                    }${option === value ? " is-selected" : ""}`}
                                    onMouseEnter={() => setActive(i)}
                                    onClick={() => pick(option)}
                                >
                                    {option}
                                    {option === value && (
                                        <i className="gg-sel-tick" aria-hidden="true" />
                                    )}
                                </button>
                            </li>
                        ))}
                    </ul>,
                    document.body
                )}
        </>
    );
}
