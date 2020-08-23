# Math Keyboard

A javascript module to add a math keyboard (with functions and greek letters keys) to your website.

It works with inputs, editable divs but works best with [mathquill](http://mathquill.com/) for mathematics symbols.

## Install

> JQuery is required for this module to work !

Download the folder and add the folowing lines to your **head** tag :


```html
<script src="https://ajax.googleapis.com/ajax/libs/jquery/1.11.0/jquery.min.js"></script>

<link rel="stylesheet" href="path/to/keyboard.css">
<script src="path/to/keyboard.js"></script>
```

## Use

**INPUTS AND DIVS :**

```html

<input id="main-input" type="text">
<script>
    

    let mathKeyboard = new MathKeyboard({
        alwaysOn: true,
        pages: [qwertyLayout, greekLettersLayout],
        linkedElement: $("#main-input"),
        linkType: "input"
    });


</script>

```

**MATHQUILL :**


```html

<div class="mathfield" id="mathfield"></div>
<script>
    
    var mathFieldSpan = document.getElementById('mathfield');

    var MQ = MathQuill.getInterface(2);
    var mathField = MQ.MathField(mathFieldSpan, {
        spaceBehavesLikeTab: true,
        // Prevents default mobile keyboard from showing (ALSO PREVENTS DESKTOP KEYBOARD FROM WORKING)
        substituteTextarea: () => {
            return $("<span id='subSpan'></span>")[0];
        },
    });

    var mathKeyboard = new MathKeyboard({
        pages: [qwertyLayout, greekLettersLayout, defaultFuncLayout],
        linkedElement: mathField,
        linkType: "mathquill",
    });

</script>

```

## Default layouts

Default layouts are `qwertyLayout`, `azertyLayout`, `greekLettersLayout`, `defaultFuncLayout`.

## Create your own layout

The `azertyLayout` was for instance created with the following function.

```javascript
var azertyLayout = new MkPage(
    "FR", // Text displayed on the button to switch layouts (Can also be the path to an image, in that case add a last argument for the icon type : "image").
    [
        NUMBER_ROW_BACKSLASH, // Number row with a backslash to add latex functions.
        ["a", "z", "e", "r", "t", "y", "u", "i", "o", "p"],
        ["q", "s", "d", "f", "g", "h", "j", "k", "l", "m"],
        [CAPS, "w", "x", "c", "v", "b", "n", BACKSPACE]
    ]
);
```

The `defaultFuncLayout` was created with the following function.


```javascript
var defaultFuncLayout = new MkPage(
    "f(x)",
    [
        NUMBER_ROW_BACKSLASH,
        ["+", "-", new MkKey("×", "\\cdot"), new MkKey("a<sup>n</sup>", "^n", [], "small", "typedText"), new MkKey("a<sub>n</sub>", "_n", [], "small", "typedText")],
        []
    ]
);
```

Let's look at one of the key : 

```javascript
new MkKey(
     "a<sup>n</sup>", // Text displayed on the key
     "^n", // Text written to the linked element
      [], // Eventual secondary characters that appear on long press.
      "small", // Size of the key : "small", "medium", "large"
      "typedText" // IF MATHQUILL: the function used to write the character ("keystroke", "typedText", "write")
)
```

The line `[e, é, è]` creates a key with the text *e*, when pressed writes *e* and on long press a menu opens to show the secondary characters *é* and *è*.

## Options for mathKeyboard

**pages :** a list of all the layouts for the keyboard

**linkedElement :** Either the mathField object in the case of mathquill or the jquery input or div element

**linkType :** "input" or "mathquill"

**alwaysOn :** boolean that decides if the keyboard should always be shown or only when the input is focused.

**toggleTransitions :** A list of css transition that trigger when the keyboard is shown or hidden. For instance 
```javascript 
toggleTransitions: [
    ["opacity", "0", "1", 1000, "ease-in"], // [property name, initial value, final value, duration, curve]
    ["bottom", "-45%", "0%", 300, "ease-in"]
]
```

**mqDefaultFunc :** The default mathquill function used to write characters.

**longPressDuration :** the duration for long press to trigger.


