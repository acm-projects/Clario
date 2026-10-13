import { useEffect, useMemo, useRef, useState, type ElementType, type HTMLAttributes, type ReactNode } from "react";
import { gsap } from "gsap";
import useReducedMotion from "../hooks/useReducedMotion";
import "./TextType.css";

// Adapted from the React Bits TextType source supplied for this project.
interface TextTypeProps extends HTMLAttributes<HTMLElement> {
  text: string | string[];
  as?: ElementType;
  typingSpeed?: number;
  initialDelay?: number;
  pauseDuration?: number;
  deletingSpeed?: number;
  loop?: boolean;
  showCursor?: boolean;
  hideCursorWhileTyping?: boolean;
  cursorCharacter?: ReactNode;
  cursorClassName?: string;
  cursorBlinkDuration?: number;
  textColors?: string[];
  variableSpeed?: { min: number; max: number };
  onSentenceComplete?: (sentence: string, index: number) => void;
  startOnVisible?: boolean;
  reverseMode?: boolean;
}

export default function TextType({
  text, as: Component = "div", typingSpeed = 50, initialDelay = 0,
  pauseDuration = 2000, deletingSpeed = 30, loop = true, className = "",
  showCursor = true, hideCursorWhileTyping = false, cursorCharacter = "|",
  cursorClassName = "", cursorBlinkDuration = 0.5, textColors = [],
  variableSpeed, onSentenceComplete, startOnVisible = false, reverseMode = false,
  ...props
}: TextTypeProps) {
  const reducedMotion = useReducedMotion();
  const textArray = useMemo(() => {
    const sentences = Array.isArray(text) ? text : [text];
    return sentences.length ? sentences : [""];
  }, [text]);
  const [displayedText, setDisplayedText] = useState("");
  const [currentTextIndex, setCurrentTextIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isVisible, setIsVisible] = useState(!startOnVisible);
  const containerRef = useRef<HTMLElement>(null);
  const cursorRef = useRef<HTMLSpanElement>(null);
  const currentText = textArray[currentTextIndex] ?? textArray[0];
  const processedText = reverseMode ? Array.from(currentText).reverse().join("") : currentText;

  useEffect(() => {
    if (!startOnVisible || !containerRef.current) return;
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        setIsVisible(true);
        observer.disconnect();
      }
    }, { threshold: 0.1 });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [startOnVisible]);

  useEffect(() => {
    if (!showCursor || reducedMotion || !cursorRef.current) return;
    const animation = gsap.fromTo(cursorRef.current, { opacity: 1 }, {
      opacity: 0, duration: cursorBlinkDuration, repeat: -1, yoyo: true, ease: "power2.inOut",
    });
    return () => { animation.kill(); };
  }, [showCursor, cursorBlinkDuration, reducedMotion]);

  useEffect(() => {
    if (reducedMotion || !isVisible || !textArray.some(Boolean)) return;
    let timeout: number;
    let sentenceIndex = 0;
    let characterIndex = 0;

    function schedule(callback: () => void, delay: number) {
      timeout = window.setTimeout(callback, Math.max(0, delay));
    }
    function nextCharacter() {
      const sentence = textArray[sentenceIndex];
      const characters = Array.from(sentence);
      if (reverseMode) characters.reverse();
      const delay = variableSpeed
        ? variableSpeed.min + Math.random() * (variableSpeed.max - variableSpeed.min)
        : typingSpeed;
      schedule(() => {
        characterIndex++;
        setDisplayedText(characters.slice(0, characterIndex).join(""));
        if (characterIndex < characters.length) {
          nextCharacter();
        } else {
          onSentenceComplete?.(sentence, sentenceIndex);
          if (!loop && sentenceIndex === textArray.length - 1) return;
          schedule(() => { setIsDeleting(true); deleteCharacter(); }, pauseDuration);
        }
      }, delay);
    }
    function deleteCharacter() {
      schedule(() => {
        const characters = Array.from(textArray[sentenceIndex]);
        if (reverseMode) characters.reverse();
        characterIndex = Math.max(0, characterIndex - 1);
        setDisplayedText(characters.slice(0, characterIndex).join(""));
        if (characterIndex > 0) {
          deleteCharacter();
        } else {
          sentenceIndex = (sentenceIndex + 1) % textArray.length;
          setCurrentTextIndex(sentenceIndex);
          setIsDeleting(false);
          nextCharacter();
        }
      }, deletingSpeed);
    }
    schedule(() => {
      setDisplayedText("");
      setCurrentTextIndex(0);
      setIsDeleting(false);
      nextCharacter();
    }, initialDelay);
    return () => window.clearTimeout(timeout);
  }, [textArray, typingSpeed, initialDelay, pauseDuration, deletingSpeed, loop, variableSpeed, onSentenceComplete, reverseMode, isVisible, reducedMotion]);

  const hideCursor = reducedMotion || (hideCursorWhileTyping && (displayedText !== processedText || isDeleting));
  return (
    <Component ref={containerRef} className={`text-type ${className}`} {...props}>
      <span className="sr-only">{currentText}</span>
      <span className="text-type__placeholder" aria-hidden="true">{processedText}{showCursor && <span className="text-type__cursor">{cursorCharacter}</span>}</span>
      <span className="text-type__visual" aria-hidden="true">
        <span className="text-type__content" style={{ color: textColors[currentTextIndex % textColors.length] || "inherit" }}>{reducedMotion ? processedText : displayedText}</span>
        {showCursor && <span ref={cursorRef} className={`text-type__cursor ${cursorClassName}${hideCursor ? " text-type__cursor--hidden" : ""}`}>{cursorCharacter}</span>}
      </span>
    </Component>
  );
}