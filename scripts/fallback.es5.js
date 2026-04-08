if (
    typeof Proxy !== "function"
    && confirm("ECMAScript 6 is not supported by this browser.\nRedirect to version 3.x of lrc-maker?")
) {
    location.href = "https://guestszhen.github.io/lrc-player/3.x";
}
