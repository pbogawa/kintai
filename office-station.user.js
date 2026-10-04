// ==UserScript==
// @name         OfficeStation 勤怠ステータス
// @namespace    local
// @version      1.0
// @match        https://attendance.officestation.jp/independent/recorder2/personal/*
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    const STORAGE_KEY = "myAttendanceState";

    function findButton(text) {
        return [...document.querySelectorAll(".record-btn-outer")]
            .find(el => el.textContent.includes(text));
    }

    function saveState(state) {
        localStorage.setItem(STORAGE_KEY, state);
        render();
    }

    function loadState() {
        return localStorage.getItem(STORAGE_KEY);
    }

    
    function getFinishedElapsed() {

        const finishedAt =
            Number(localStorage.getItem("finishedAt"));

        if (!finishedAt) {
            return "";
        }

        const elapsed =
            Math.floor((Date.now() - finishedAt) / 60000);

        const hours = Math.floor(elapsed / 60);
        const minutes = elapsed % 60;

        return `（退勤後 ${hours}時間${minutes}分）`;
    }

    function getStatusText(state) {
        switch(state) {
            case "working":
                return "🟢 出勤中";

            case "outing":
                return "🟠 外出中";

            case "finished":
                return "⚫ 退勤済み " + getFinishedElapsed();

            default:
                return "";
        }
    }

    function ensureStatusBar() {

        let bar = document.getElementById("myStatusBar");

        if (!bar) {

            bar = document.createElement("div");
            bar.id = "myStatusBar";

            Object.assign(bar.style, {
                position: "fixed",
                top: "0",
                left: "0",
                right: "0",
                height: "50px",
                background: "#1976d2",
                color: "white",
                fontSize: "24px",
                fontWeight: "bold",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                zIndex: "99999",
                boxShadow: "0 2px 10px rgba(0,0,0,0.3)"
            });

            document.body.appendChild(bar);
        }

        bar.textContent = getStatusText(loadState());
        if (!document.getElementById("shortcutTestButton")) {

            const testButton = document.createElement("button");

            testButton.id = "shortcutTestButton";

            testButton.textContent = "ショートカットテスト";

            Object.assign(testButton.style, {
                position: "fixed",
                top: "60px",
                right: "10px",
                zIndex: "99999",
                padding: "10px",
                fontSize: "16px"
            });

            testButton.addEventListener("click", () => {


                location.href =
                    "shortcuts://run-shortcut?name=外出通知";
            });

            document.body.appendChild(testButton);
        }
    }

    function highlight(button, enabled) {

        if (!button) return;

        if (enabled) {
            button.style.outline = "5px solid #00ff66";
            button.style.opacity = "1";
        } else {
            button.style.outline = "";
            button.style.opacity = "0.35";
        }
    }

    function renderButtons() {

        const state = loadState();

        const startBtn = findButton("出勤");
        const endBtn = findButton("退勤");
        const outBtn = findButton("外出開始");
        const backBtn = findButton("外出終了");

        // 未設定時
        if (!state) {
            highlight(startBtn, false);
            highlight(endBtn, false);
            highlight(outBtn, false);
            highlight(backBtn, false);
            return;
        }
            
        if (state === "beforeWork") {

            highlight(startBtn, true);
            highlight(endBtn, false);
            highlight(outBtn, false);
            highlight(backBtn, false);

        } else if (state === "working") {

            highlight(startBtn, false);
            highlight(endBtn, true);
            highlight(outBtn, true);
            highlight(backBtn, false);

        } else if (state === "outing") {

            highlight(startBtn, false);
            highlight(endBtn, false);
            highlight(outBtn, false);
            highlight(backBtn, true);

        } else if (state === "finished") {

            highlight(startBtn, true);
            highlight(endBtn, false);
            highlight(outBtn, false);
            highlight(backBtn, false);
        }
    }

    function render() {
        ensureStatusBar();
        renderButtons();
    }

    function registerEvents() {

        const startBtn = findButton("出勤");
        const endBtn = findButton("退勤");
        const outBtn = findButton("外出開始");
        const backBtn = findButton("外出終了");

        if (!startBtn || startBtn.dataset.myHooked) {
            return;
        }

        startBtn.dataset.myHooked = "1";

        startBtn.addEventListener("click", () => {
            setTimeout(() => saveState("working"), 300);
        });

        endBtn.addEventListener("click", () => {

            localStorage.setItem(
                "finishedAt",
                Date.now()
            );

            setTimeout(() => saveState("finished"), 300);
        });

        outBtn.addEventListener("click", () => {

            const minutes = prompt(
                "外出予定時間を入力してください\n15,30,45,60,90,120",
                "60"
            );

            if (
                minutes &&
                ["15","30","45","60","90","120"].includes(minutes)
            ) {

                location.href =
                `shortcuts://run-shortcut?name=外出通知&input=text&text=${minutes}`;
            }

            setTimeout(() => saveState("outing"), 300);
        });

        backBtn.addEventListener("click", () => {
            setTimeout(() => saveState("working"), 300);
        });
    }

    const timer = setInterval(() => {

        const startBtn = findButton("出勤");

        if (startBtn) {

            registerEvents();
            render();

            clearInterval(timer);
        }

    }, 500);

    setInterval(() => {

        if (loadState() === "finished") {
            ensureStatusBar();
        }

    }, 60000);

})();