



// Special keys to insert in rows
var BACKSPACE = "BACKSPACE";
var CAPS = "CAPS";
var SPACER_S = "SPACER_S";
var SPACER_M = "SPACER_M";

window.BACKSPACE = BACKSPACE;
window.CAPS = CAPS;
window.SPACER_S = SPACER_S;
window.SPACER_M = SPACER_M;


class MathKeyboard {

    /**
     *      
     * @param {Object} options Valid options are : longPressDuration, linkedElement, linkType, pages, alwaysOn, toggleTransition
     * 
     */

    constructor(options) {
        
        this.linkedElement = options["linkedElement"] || null;
        this.linkType = options["linkType"] || null;
        this.mqDefaultFunc = options["mqDefaultFunc"] || "write";
        
        this.keyboard = $(`<div class="mobile-keyboard" oncontextmenu="return false;"></div>`);
        $("body").append(this.keyboard);

        // Variables

        // Long press variables
        this.longPressTimer;

        this.currPageIndex = 0;
        this.capsEnabled = false;
        this.capsLockEnabled = false;

        // Add Options

        this.longPressDuration = options["longPressDuration"] || 500;
        this.pages = options["pages"] || [];
        this.alwaysOn = options["alwaysOn"] || false;         

        this.toggleTransitions = options["toggleTransitions"] || [["bottom", "-45%", "0%", 300, "ease-in"]];

        this.addTransitions();  

        if( this.alwaysOn ) {

            this.keyboard.css("display", "block");

        } else {

            if (this.linkType == "mathquill") {

                $(this.linkedElement["__controller"]["container"][0]).on("click", (evt) => {

                    this.showKeyboard();
                    evt.stopPropagation();

                });

            } else {

                this.linkedElement.on("click", (evt) => {

                    this.showKeyboard();
                    evt.stopPropagation();
    
                });

            }

            this.keyboard.on("click", (evt) => {
                evt.stopPropagation();
            });

            $("body").on("click", () => {

                this.hideKeyboard();

            });

            

        }


        this.keyIndex = 0;

        let j = 0
        for (let page of this.pages) {
            this.createKBPage(page, j);
            j++;
        }

        this.selectedIndex = 0;

        this.showPageAtIndex(0);

        this.previousEventTimeStamp = 0;

        // MathJax.Hub.Queue(["PreProcess",MathJax.Hub], ["Reprocess",MathJax.Hub]);
       

    }

    showPageAtIndex = (index) => {
        $("#kb-page-" + this.selectedIndex.toString()).css("z-index", "1")
        $("#kb-page-" + index.toString()).css("z-index", "10");

        this.selectedIndex = index;
    }

    // Sets the DOM element to which the characters will be written on a keypress;

    setMathQuillField = (mathField, mqDefaultFunc = "write") => {

        this.linkedElement = mathField;
        this.linkType = "mathquill";
        // Defines the mathquill function used to write to the field (typedText, write, keystroke);
        this.mqDefaultFunc = mqDefaultFunc;

    }

    setInputField = (inputField) => {

        this.linkedElement = $(inputField);
        this.linkType = "input";

    }


    // Creates a keyboard page based on a layout
    createKBPage = (page, index) => {

        let pageDiv = $(`<div class="kb-page" id="kb-page-${index}"></div>`)

        this.keyboard.append(pageDiv);

        for (let row of page.layout) {

            let rowDiv = $(`<div class="kb-row"></div>`);

            pageDiv.append(rowDiv);

            for (let char of row) {

                // Handle special characters
                if (["BACKSPACE", "CAPS", "SPACER_M", "SPACER_S"].includes(char)) this.addSpecialChar(rowDiv, char);

                // The character is given with a simple string : "a", "b", ...
                else if (typeof char === "string") this.addKey(rowDiv, char, char);

                else if (typeof char === "number") this.addKey(rowDiv, char.toString(), char.toString());

                // The character is given with a list of strings to account for secondary characters : ["e", "é", "è", "ê"]
                else if (!Object.keys(char).includes("symbol")) this.addKey(rowDiv, char[0], char[0], char.slice(1, char.length).map( (el) => [el, el] ))

                // The character is a MkKey object
                else {

                    let other_keys = [];
                    for (let secondary of char.other_chars) {

                        if (typeof secondary == "object") other_keys.push(secondary);
                        else other_keys.push([secondary, secondary]);


                    }

                    this.addKey(rowDiv, char.symbol, char.action, other_keys, char.size, char.mqFunc);
                    
                }

            }

        } 

        // Create last row (w/ spacebar and menu buttons)

        let rowDiv = $(`<div class="kb-row"></div>`);
        pageDiv.append(rowDiv);

        let nextIndex = (this.pages.indexOf(page) + 1) % this.pages.length;
        let nextPage = this.pages[nextIndex];

        let menuSwapper = $(`<div class="kb-key kb-key-medium">${nextPage.iconType == "text" ? nextPage.icon : "<img src='" + nextPage.icon + "' style='height: 80%; margin-top: 10%'>"}</div>`);
        rowDiv.append(menuSwapper);

        menuSwapper.click(() => {
            this.showPageAtIndex(nextIndex);
        });
        
        let spacebar = $(`<div class="kb-key spacebar-key"></div>`)
        rowDiv.append(spacebar);

        spacebar.click(() => {
            
            if (this.linkType == "mathquill") {
                console.log("Space");
                this.linkedElement.keystroke("Space");
            } else if (this.linkType == "input") {
                this.linkedElement.insertAtCursorInput(" ");
            }
        });
        
        this.addSpecialChar(rowDiv, SPACER_M);


    }


    // Adds a key to the keyboard and sets up the event listeners

    addKey = (row, sym, action, other_keys = [], size = "small", mqFunc = "") => {

        let keyTemplate = `<div class="kb-key kb-key-${size}${other_keys.length ? " kb-dot" : ""}" id="mkb-${this.keyIndex.toString()}">${sym}</div>`;

        row.append(keyTemplate);
        
        $("#mkb-" + this.keyIndex.toString()).click(() => {
            this.writeToElement(action, mqFunc);
        });

        // Check if there are secondary characters for a same key, those can be accents for instance (e -> é, è ê) or other variants
        if (other_keys.length) {

            // Sets up the long press event to show the window allowing the user to chose which secondary character to type
            this.longPressEvent($("#mkb-" + this.keyIndex.toString()), (evt) => {

                let key_pos = $(evt.target).position();

                // Create DOM element
                let otherCharsElement = $(`<div class="kb-other-chars" style="left: ${key_pos["left"]}px; top: ${key_pos["top"] - 100 - (other_keys.length - 2)*60}px"></div>`);

                this.keyboard.append(otherCharsElement);

                let k = 0;
                for (let key_ of other_keys) {
        
                    // Add secondary key button to the div
                    let other_char_btn = $(`<div class="kb-other-chars-btn" id="other-chars-btn-${k.toString()}">${key_[0]}</div>`);

                    otherCharsElement.append(other_char_btn);

                    $("#other-chars-btn-" + k.toString()).click(() => {
                        this.writeToElement(key_[1]);
                        $(".kb-other-chars").remove();
                    });
                    
                    k++

                }

            });

        }

        this.keyIndex++;

    }

    // Handle special chars (BACKSPACE, CAPS, SPACER)

    addSpecialChar = (row, char) => {

        if (char === "BACKSPACE") {
            
            let keyTemplate = $(`<div class="kb-key kb-sc kb-key-medium backspace-key"><img src="${getScriptPath()}/icons/backspace.png" class="backspace-img"></div>`);

            row.append(keyTemplate);

            $(".backspace-key").click(this.backspaceHandler);

        } else if (char === "CAPS") {

            let keyTemplate = $(`<div class="kb-key kb-sc kb-key-medium caps-key kb-dot"><img src="${getScriptPath()}/icons/up-arrow.png" class="caps-img"></div>`);

            row.append(keyTemplate);

            $(".caps-key").click(this.capsHandler);

            $(".caps-key").dblclick(this.capsLockHandler);

        }
        
        else if (char === "SPACER_S") row.append($(`<div class="kb-spacer-s"></div>`))
        else if (char === "SPACER_M") row.append($(`<div class="kb-spacer-m"></div>`))

    }

    backspaceHandler = (evt) => {

        if (evt.timeStamp == this.previousEventTimeStamp) return;

        this.previousEventTimeStamp = evt.timeStamp;

        if (this.linkType == "input") {

            this.insertAtCursorInput("", true);

        } else if (this.linkType == "mathquill") {

            this.linkedElement.focus()
            this.linkedElement.keystroke("Shift-Left Del")

        }


    }

    capsHandler = (evt) => {

        if (evt.timeStamp == this.previousEventTimeStamp) return;

        this.previousEventTimeStamp = evt.timeStamp;

        this.capsEnabled = !this.capsEnabled;

        if (this.capsLockEnabled) {
            this.capsLockEnabled = false;
            $(".caps-key").removeClass("kb-caps-lock-enabled");
        }

        if (this.capsEnabled == true) {
            $(".kb-key:not(.kb-sc)").css("text-transform", "uppercase");
            $(".caps-key").addClass("kb-caps-enabled");
        }
        else {
            $(".kb-key:not(.kb-sc)").css("text-transform", "none");
            $(".caps-key").removeClass("kb-caps-enabled");
        }
        
    }

    capsLockHandler = (evt) => {

        if (evt.timeStamp == this.previousEventTimeStamp) return;

        this.previousEventTimeStamp = evt.timeStamp;

        this.capsLockEnabled = true;
        this.capsEnabled = true;
        $(".kb-key:not(.kb-sc)").css("text-transform", "uppercase");
        $(".caps-key").addClass("kb-caps-lock-enabled");
    }

    // Adds a transition to the css properties of the keyboard

    addTransitions = () => {
        
        let text = "";

        this.transitionMaxDur = 0;

        for (let transition of this.toggleTransitions) {

            text += transition[0] + " " + (transition[3]/1000).toString() + "s " + transition[4] + " ";

            this.transitionMaxDur = this.transitionMaxDur < transition[3] ? transition[3] : this.transitionMaxDur;

            this.keyboard.css(transition[0], transition[1]);

        }

        this.keyboard.css("transition", text);

    }

    // Writes the value to the linked HTML element

    writeToElement = (action, mqFunc = "") => {

        if (this.linkType == "mathquill") {

            eval("this.linkedElement." + (mqFunc == "" ? this.mqDefaultFunc : mqFunc) + "('" + (action.replace("\\", "\\\\")) + "')");

        } else if (this.linkType == "input") {

            this.insertAtCursorInput(action);

        } else {

            // If no element was set, return an error
            throw "No Output type has been set.\n Please use one of the following functions : \n setMathQuillField, setInputField";

        }


    }

    // Inserts the value in an input field at the cursor location

    insertAtCursorInput = (value, del = false) => {

        let field = this.linkedElement[0];

        // IE Support
        if (document.selection) {

            field.focus();
            let sel = document.selection.createRange();
            sel.text = value;

        } 
        // Others
        else if (field.selectionStart || field.selectionStart == "0") {

            let startPos = field.selectionStart;
            let endPos = field.selectionEnd;


            if (!del) {

                field.value = field.value.substring(0, startPos) + value + field.value.substring(endPos, field.value.length);

                this.setCursorPosition(field, startPos + value.length); 

            } else {

                field.value = field.value.substring(0, startPos - 1) + field.value.substring(endPos, field.value.length);

                if (startPos) this.setCursorPosition(field, startPos - 1); 

            }
            


        } else {

            if (!del) field.value += value;
            else field.value = field.value.slice(0, -1);

        }

    }

    // Sets the cursor position in a textbox to a given index

    setCursorPosition = (element, index) => {

        if (element.createTextRange) {

            let range = element.createTextRange();
            range.move('character', index);
            range.select();

        } else if (element.setSelectionRange) {

            element.focus();
            element.setSelectionRange(index, index)

        } else {

            element.focus();

        }

        

    }


    // Handles long press event

    longPressEvent = (element, handler) => {

        // On touch start, start timer for handler
        element.on("touchstart", (evt) => {
            this.longPressTimer = setTimeout(() => handler(evt), this.longPressDuration);
        });

        // Stop timer if the touch is stopped
        element.on("touchend touchleave touchcancel", (evt) => {
            clearTimeout(this.longPressTimer);
        });



    }

    // Hide and show functions for the keyboard

    showKeyboard = () => {

        this.keyboard.css("display", "block");

        setTimeout(() => {

            for (let transition of this.toggleTransitions) {

                this.keyboard.css(transition[0], transition[2]);

            }

        }, 100);

    }

    hideKeyboard = () => {

        for (let transition of this.toggleTransitions) {

            this.keyboard.css(transition[0], transition[1]);

        }

        setTimeout(() => {
            this.keyboard.css("display", "none");
        }, this.transitionMaxDur);

        

    }


}

class MkPage {


    constructor (icon, layout = [], iconType = "text") {

        this.layout = layout;
        this.icon = icon;
        this.iconType = iconType;

    }


    addRow = (row) => this.data.push(row)

    

}



class MkKey {

    constructor(symbol, action = "", secondary = [], size = "small", mqFunc = "") {

        this.symbol = symbol;
        this.action = action === "" ? symbol : action;
        this.other_chars = secondary;
        this.size = size;
        this.mqFunc = mqFunc;


    }

}

getScriptPath = () => {
    let scripts = document.getElementsByTagName("script");
    for (let script of scripts) {
        let split_src = script.src.split("/");
        if (split_src[split_src.length - 1] === "keyboard.js") {
            return split_src.slice(0, -1).join("/");
        }
    }
}

var NUMBER_ROW = [1, 2, 3, 4, 5, 6, 7, 8, 9, 0];
window.NUMBER_ROW = NUMBER_ROW;

var NUMBER_ROW_BACKSLASH = [new MkKey("\\", "\\", [], "small", "typedText"), 1, 2, 3, 4, 5, 6, 7, 8, 9, 0];
window.NUMBER_ROW_BACKSLASH = NUMBER_ROW_BACKSLASH;

var greekLettersLayout = new MkPage(
    "σΣ",
    [
        NUMBER_ROW_BACKSLASH,
        [
            new MkKey("α", "\\alpha"), 
            new MkKey("β", "\\beta"), 
            new MkKey("γ", "\\gamma", [["Γ", "\\Gamma"]]), 
            new MkKey("δ", "\\delta", [["Δ", "\\Delta"]]), 
            new MkKey("ϵ", "\\epsilon", [["ε", "\\varepsilon"]]), 
            new MkKey("ζ", "\\zeta"), 
            new MkKey("η", "\\eta"), 
            new MkKey("θ", "\\theta", [["Θ", "\\Theta"], ["ϑ", "\\vartheta"]])
        ],
        [
            new MkKey("ι", "\\iota"),
            new MkKey("κ", "\\kappa"),
            new MkKey("λ", "\\lambda", [["Λ", "\\Lambda"]]),
            new MkKey("μ", "\\mu"),
            new MkKey("ν", "\\nu"),
            new MkKey("ξ", "\\xi", [["Ξ", "\\Xi"]]),
            new MkKey("π", "\\pi", [["Π", "\\Pi"]]),
            new MkKey("ρ", "\\rho", [["ϱ", "\\varrho"]]),
            new MkKey("σ", "\\sigma", [["Σ", "\\Sigma"]])
        ],
        [
            new MkKey("τ", "\\Tau"),
            new MkKey("υ", "\\Upsilon", [["ϒ", "\\Upsilon"]]),
            new MkKey("φ", "\\phi", [["ϕ", "\\varphi"], ["Φ", "\\Phi"]]),
            new MkKey("χ", "\\chi"),
            new MkKey("ψ", "\\psi"),
            new MkKey("Ψ", "\\Psi"),
            new MkKey("ω", "\\omega", [["Ω", "\\Omega"]]),
            BACKSPACE
        ]
    ]
)

var qwertyLayout = new MkPage(
    "EN",
    [
        NUMBER_ROW_BACKSLASH,
        ["q", "w", "e", "r", "t", "y", "u", "i", "o", "p"],
        ["a", "s", "d", "f", "g", "h", "j", "k", "l"],
        [CAPS, "z", "x", "c", "v", "b", "n", "m", BACKSPACE]
    ]
);

var azertyLayout = new MkPage(
    "FR",
    [
        NUMBER_ROW_BACKSLASH,
        ["a", "z", "e", "r", "t", "y", "u", "i", "o", "p"],
        ["q", "s", "d", "f", "g", "h", "j", "k", "l", "m"],
        [CAPS, "w", "x", "c", "v", "b", "n", BACKSPACE]
    ]
);

var defaultFuncLayout = new MkPage(
    "f(x)",
    [
        NUMBER_ROW_BACKSLASH,
        ["+", "-", new MkKey("×", "\\cdot"), new MkKey("a<sup>n</sup>", "^n", [], "small", "typedText"), new MkKey("a<sub>n</sub>", "_n", [], "small", "typedText")],
        []
    ]
)