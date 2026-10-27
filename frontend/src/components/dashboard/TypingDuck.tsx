export default function TypingDuck() {
  return <img
    src={import.meta.env.BASE_URL + "typingduck.gif"}
    alt=""
    aria-hidden="true"
    draggable={false}
    className="pointer-events-none mx-auto block aspect-[5/6] h-auto w-full select-none object-contain scale-[2.25]"
  />;
}
