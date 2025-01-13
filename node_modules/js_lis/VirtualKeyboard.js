import { layouts } from './layouts.js';

export class VirtualKeyboard {
    constructor() {
        this.currentLayout = 'en';
        this.isVisible = false;
        this.container = document.getElementById('keyboard-container');
        this.currentInput = null;
        this.layouts = layouts;
        this.isDragging = false;
        this.offsetX = 0;
        this.offsetY = 0;
        this.shiftActive = false;
        this.capsLockActive = false;
        this.secretKey = '1234567890abcdef'; // คีย์ที่ใช้ในการเข้ารหัส
        // ใช้ Web Crypto API สำหรับการจัดการคีย์
        this.cryptoKey = null;
        this.iv = window.crypto.getRandomValues(new Uint8Array(12)); // สร้าง IV สำหรับการเข้ารหัส/ถอดรหัส
        this.generateKey();

        this.render();
        this.initializeInputListeners();
    }

    async generateKey() {
        this.cryptoKey = await window.crypto.subtle.generateKey(
            { name: "AES-GCM", length: 256 },
            true,
            ["encrypt", "decrypt"]
        );
    }

    async encodeText(text) {
        const encodedData = new TextEncoder().encode(text);
        const encryptedData = await window.crypto.subtle.encrypt(
            { name: "AES-GCM", iv: this.iv },
            this.cryptoKey,
            encodedData
        );
        return this.arrayBufferToBase64(encryptedData); // แปลงเป็น Base64
    }

    async decodeText(base64Text) {
        const encryptedData = this.base64ToArrayBuffer(base64Text);
        const decryptedData = await window.crypto.subtle.decrypt(
            { name: "AES-GCM", iv: this.iv },
            this.cryptoKey,
            encryptedData
        );
        return new TextDecoder().decode(decryptedData);
    }

    arrayBufferToBase64(buffer) {
        let binary = '';
        const bytes = new Uint8Array(buffer);
        const len = bytes.byteLength;
        for (let i = 0; i < len; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        return window.btoa(binary);
    }

    base64ToArrayBuffer(base64) {
        const binaryString = window.atob(base64);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }
        return bytes.buffer;
    }

    getLayoutName(layout) {
        switch (layout) {
            case 'en': return 'English Keyboard';
            case 'enSc': return 'English scrambled';
            case 'th': return 'Thai keyboard';
            case 'thSc': return 'Thai scrambled';
            case 'numpad': return 'Numpad Keyboard';
            case 'scNum': return 'Scrambled Keyboard';
        }
    }

    initializeInputListeners() {
        document.addEventListener('click', (e) => {
            const target = e.target;
            if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
                this.setCurrentInput(target);
            }
        });

        document.addEventListener('focus', (e) => {
            const target = e.target;
            if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
                this.setCurrentInput(target);
            }
        }, true);

        document.addEventListener('click', (e) => {
            const target = document.getElementById("toggle");
            target.addEventListener('click', this.toggle.bind(this), { once: true });
        });
    }

    setCurrentInput(inputElement) {
        if (this.currentInput) {
            this.currentInput.classList.remove('keyboard-active');
        }

        this.currentInput = inputElement;
        this.currentInput.classList.add('keyboard-active');
    }

    render() {
        const keyboard = document.createElement('div');
        keyboard.className = 'virtual-keyboard';
        keyboard.style.display = this.isVisible ? 'block' : 'none';
        keyboard.id = 'keyboard';

        const controlsContainer = document.createElement('div');
        controlsContainer.className = 'controls';
        controlsContainer.style.display = 'flex';
        controlsContainer.style.justifyContent = 'center';
        controlsContainer.style.alignItems = 'center';
        controlsContainer.style.marginBottom = '10px'; 

        const layoutSelector = document.createElement('select');
        layoutSelector.id = 'layout-selector';
        layoutSelector.onchange = (e) => this.changeLayout(e.target.value);

        const layouts = ['en', 'enSc', 'th', 'thSc', 'numpad', 'scNum'];
        layouts.forEach(layout => {
            const option = document.createElement('option');
            option.value = layout;
            option.innerText = this.getLayoutName(layout);
            layoutSelector.appendChild(option);
        });
        layoutSelector.value = this.currentLayout;
        controlsContainer.appendChild(layoutSelector);

        keyboard.appendChild(controlsContainer);

        const layout = this.layouts[this.currentLayout];

        layout.forEach(row => {
            const rowElement = document.createElement('div');
            rowElement.className = 'keyboard-row';

            row.forEach(key => {
                const keyElement = document.createElement('button');
                keyElement.className = 'keyboard-key key';
                keyElement.textContent = key;
                keyElement.type = 'button';

                keyElement.dataset.key = key;

                if (key === 'Space') {
                    keyElement.className += ' space';
                }

                if (key === 'backspace') {
                    keyElement.className += ' backspacew';
                }

                keyElement.onclick = (e) => {
                    e.preventDefault();
                    const keyPressed = keyElement.dataset.key || keyElement.textContent;
                    if (keyPressed) {
                        this.handleKeyPress(keyPressed);
                    } else {
                        console.error("The key element does not have a valid key value.");
                    }
                };

                rowElement.appendChild(keyElement);
            });

            keyboard.appendChild(rowElement);
        });

        this.container.innerHTML = '';
        this.container.appendChild(keyboard);

        if (this.currentLayout === "scNum") {
            this.scrambleKeyboard();
        }

        if (this.currentLayout === "enSc") {
            this.scrambleEnglishKeys();
        }

        if (this.currentLayout === "thSc") {
            this.scrambleThaiKeys();
        }

        keyboard.addEventListener('mousedown', (event) => this.startDrag(event));
    }

    async handleKeyPress(keyPressed) {
        if (!this.currentInput) return;

        const start = this.currentInput.selectionStart;
        const end = this.currentInput.selectionEnd;
        const value = this.currentInput.value;

        const isCapsActive = this.capsLockActive;
        const isShiftActive = this.shiftActive;

        const convertToCorrectCase = (char) => {
            if (isCapsActive || isShiftActive) {
                return char.toUpperCase();
            }
            return char.toLowerCase();
        };

        if (!keyPressed) {
            console.error("Invalid key pressed.");
            return;
        }

        switch(keyPressed) {
            case 'Backspace':
            case 'backspace':
                if (start === end && start > 0) {
                    this.currentInput.value = value.slice(0, start - 1) + value.slice(end);
                    this.currentInput.selectionStart = this.currentInput.selectionEnd = start - 1;
                } else {
                    this.currentInput.value = value.slice(0, start) + value.slice(end);
                    this.currentInput.selectionStart = this.currentInput.selectionEnd = start;
                }
                break;

            case 'Space':
                await this.insertText(' ');
                break;

            case 'Tab':
                await this.insertText('\t');
                break;

            case 'Enter':
                if (this.currentInput.tagName === 'TEXTAREA') {
                    await this.insertText('\n');
                }
                break;

            case 'Caps':
                this.toggleCapsLock();
                break;

            case 'Shift':
                this.toggleShift();
                break;

            default:
                const encryptedText = await this.encodeText(convertToCorrectCase(keyPressed));
                await this.insertText(encryptedText);
        }

        if (isShiftActive && !isCapsActive) {
            this.toggleShift();
        }

        this.currentInput.focus();
        const event = new Event('input', { bubbles: true });
        this.currentInput.dispatchEvent(event);
        // console.log(this.encodeText(convertToCorrectCase(keyPressed)));
        // console.log(keyPressed);
    }

    async insertText(text) {
        const start = this.currentInput.selectionStart;
        const end = this.currentInput.selectionEnd;
        const decodedText = await this.decodeText(text);  // ใช้ถอดรหัสก่อนแทรก

        this.currentInput.value = this.currentInput.value.slice(0, start) + decodedText + this.currentInput.value.slice(end);
        this.currentInput.selectionStart = this.currentInput.selectionEnd = start + decodedText.length;
    }
    
    toggleCapsLock() {
        this.capsLockActive = !this.capsLockActive;
        const capsKey = document.querySelector('.key[data-key="Caps"]');
        capsKey.classList.toggle("active", this.capsLockActive);
        capsKey.classList.toggle("bg-gray-400", this.capsLockActive);
    
        document.querySelectorAll(".key").forEach((key) => {
            if (key.dataset.key.length === 1 && /[a-zA-Zก-๙]/.test(key.dataset.key)) {
                key.textContent = this.capsLockActive
                    ? key.dataset.key.toUpperCase()
                    : key.dataset.key.toLowerCase();
            }
        });
    
        const keyboardKeys = document.querySelectorAll(".key:not([data-key='Shift'])");
        keyboardKeys.forEach((key) => {
            const currentChar = key.textContent.trim();
            if (
                this.capsLockActive &&
                this.currentLayout === "th" &&
                this.ThaiAlphabetShift[currentChar]
            ) {
                key.textContent = this.ThaiAlphabetShift[currentChar];
                key.dataset.key = this.ThaiAlphabetShift[currentChar];
            } else if (
                !this.capsLockActive &&
                this.currentLayout === "th" &&
                Object.values(this.ThaiAlphabetShift).includes(currentChar)
            ) {
                const originalKey = Object.keys(this.ThaiAlphabetShift).find(
                    (key) => this.ThaiAlphabetShift[key] === currentChar
                );
                if (originalKey) {
                    key.textContent = originalKey;
                    key.dataset.key = originalKey;
                }
            }
        });
    }
    
    toggleShift() {
        this.shiftActive = !this.shiftActive;
        const shiftKey = document.querySelector('.key[data-key="Shift"]');
        shiftKey.classList.toggle("active", this.shiftActive);
        shiftKey.classList.toggle("bg-gray-400", this.shiftActive);
    
        document.querySelectorAll(".key").forEach((key) => {
            if (key.dataset.key.length === 1 && /[a-zA-Zก-๙]/.test(key.dataset.key)) {
                // แสดงผลตัวพิมพ์ใหญ่หรือเล็กตามค่า Shift
                key.textContent = this.shiftActive
                    ? key.dataset.key.toUpperCase()
                    : key.dataset.key.toLowerCase();
            }
        });
    
        const keyboardKeys = document.querySelectorAll(".key:not([data-key='Shift'])");
        keyboardKeys.forEach((key) => {
            const currentChar = key.textContent.trim();
            if (
                this.shiftActive &&
                this.currentLayout === "th" && // ตรวจสอบว่ากำลังใช้เลย์เอาต์ภาษาไทย
                this.ThaiAlphabetShift[currentChar]
            ) {
                key.textContent = this.ThaiAlphabetShift[currentChar]; // แสดงอักษรจาก shift
                key.dataset.key = this.ThaiAlphabetShift[currentChar]; // อัปเดต dataset.key
            } else if (
                !this.shiftActive &&
                this.currentLayout === "th" &&
                Object.values(this.ThaiAlphabetShift).includes(currentChar)
            ) {
                const originalKey = Object.keys(this.ThaiAlphabetShift).find(
                    (key) => this.ThaiAlphabetShift[key] === currentChar
                );
                if (originalKey) {
                    key.textContent = originalKey;
                    key.dataset.key = originalKey;
                }
            }
        });
    }

    ThaiAlphabetShift = {
        _: "%",
        ๅ: "+",
        "/": "๑",
        "-": "๒",
        ภ: "๓",
        ถ: "๔",
        "ุ": "ู",
        "ึ": "฿",
        ค: "๕",
        ต: "๖",
        จ: "๗",
        ข: "๘",
        ช: "๙",
        ๆ: "๐",
        ไ: '"',
        ำ: "ฎ",
        พ: "ฑ",
        ะ: "ธ",
        "ั": "ํ",
        "ี": "๋",
        ร: "ณ",
        น: "ฯ",
        ย: "ญ",
        บ: "ฐ",
        ล: ",",
        ฃ: "ฅ",
        ฟ: "ฤ",
        ห: "ฆ",
        ก: "ฏ",
        ด: "โ",
        เ: "ฌ",
        "้": "็",
        "่": "๋",
        า: "ษ",
        ส: "ศ",
        ว: "ซ",
        ง: ".",
        ผ: "(",
        ป: ")",
        แ: "ฉ",
        อ: "ฮ",
        "ิ": "ฺ",
        "ื": "์",
        ท: "?",
        ม: "ฒ",
        ใ: "ฬ",
        ฝ: "ฦ",
    };

    toggle() {
        this.isVisible = !this.isVisible;
        this.render();
    }

    changeLayout(layout) {
        this.currentLayout = layout;
        this.render();
    }

    shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [array[i], array[j]] = [array[j], array[i]];
        }
      }
    
    scrambleKeyboard() {
        const keys = document.querySelectorAll(
          ".key:not([data-key=backspace]):not([data-key='+']):not([data-key='-']):not([data-key='*']):not([data-key='/']):not([data-key='%']):not([data-key='=']):not([data-key='.']):not([data-key='00'])"
        );
        const numbers = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"];
        this.shuffleArray(numbers);
        keys.forEach((key, index) => {
          key.textContent = numbers[index];
          key.dataset.key = numbers[index];
        });
      }
    
    scrambleEnglishKeys() {
        const keys = document.querySelectorAll(
          ".key:not([data-key='Space']):not([data-key='Backspace']):not([data-key='Caps']):not([data-key='Shift']):not([data-key='Enter']):not([data-key='Tab']):not([data-key='`']):not([data-key='1']):not([data-key='2']):not([data-key='3']):not([data-key='4']):not([data-key='5']):not([data-key='6']):not([data-key='7']):not([data-key='8']):not([data-key='9']):not([data-key='0']):not([data-key='-']):not([data-key='+']):not([data-key='='])"
        );
        const englishAlphabet = "abcdefghijklmnopqrstuvwxyz".split("");
        this.shuffleArray(englishAlphabet);
        keys.forEach((key, index) => {
          key.textContent = englishAlphabet[index];
          key.dataset.key = englishAlphabet[index];
        });
      }
    
      scrambleThaiKeys() {
        const keys = document.querySelectorAll(
            ".key:not([data-key='Backspace']):not([data-key='Caps']):not([data-key='Shift']):not([data-key='Enter']):not([data-key='Space'])"
        );
        const ThaiAlphabet = "กขฃคฅฆงจฉชซฌญฎฏฐฑฒณดตถทธนบปผฝพฟภมยรฤลฦวศษสหฬอฮ".split("");
        this.shuffleArray(ThaiAlphabet); // สับเปลี่ยนลำดับของตัวอักษร
    
        keys.forEach((key, index) => {
            // อัพเดต textContent และ dataset.key ให้ตรงกับค่าใหม่ที่สับเปลี่ยน
            key.textContent = ThaiAlphabet[index];
            key.dataset.key = ThaiAlphabet[index];  // อัพเดต dataset.key ด้วยค่าใหม่
        });
    }
    
    
    // จัดการการลากคีย์บอร์ด
    startDrag(event) {
        this.isDragging = true;
        this.offsetX = event.clientX - document.getElementById("keyboard").offsetLeft;
        this.offsetY = event.clientY - document.getElementById("keyboard").offsetTop;
      
        document.addEventListener("mousemove", this.drag.bind(this)); // Use bind to preserve `this` context
        document.addEventListener("mouseup", () => {
          this.isDragging = false;
          document.removeEventListener("mousemove", this.drag.bind(this));
        });
    }
  
    drag(event) {
        if (this.isDragging) {
            const keyboard = document.getElementById("keyboard");
            keyboard.style.left = `${event.clientX - this.offsetX}px`;
            keyboard.style.top = `${event.clientY - this.offsetY}px`;
        }
    }
    
}
