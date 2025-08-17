//=============================================================================
// SHK_Storage_Unified_MV_MZ.js
//=============================================================================
/*:
 * @target MZ
 * @plugindesc v1.8.1 - Storage chest compatible with YEP_ItemCore for MV & MZ.
 * @author Shinkohyou, Gemini (Assistant)
 * @base YEP_ItemCore
 * @url https://github.com/Shinkohyou/RMMZ_Plug-Ins
 *
 * @command OpenStorageChest
 * @text Open Chest
 * @desc Opens the storage chest scene.
 *
 * @command DepositItem
 * @text Deposit Item
 * @desc Deposits an item or equipment into the chest without the party needing to possess it first.
 *
 * @arg category
 * @text Category
 * @type select
 * @option item
 * @option weapon
 * @option armor
 * @option keyItem
 * @desc The category of the item (item, weapon, armor, or keyItem).
 *
 * @arg itemId
 * @text Item ID
 * @type number
 * @min 1
 * @desc The item's ID in the database.
 *
 * @arg quantity
 * @text Quantity
 * @type number
 * @min 1
 * @desc The amount to deposit.
 *
 * @help
 * ============================================================================
 * SHK_Storage_Unified (for MV & MZ)
 * ============================================================================
 * Requirements:
 *  - YEP_ItemCore.js must be installed and active.
 *  - Place this plugin below YEP_ItemCore in the plugin list.
 * ============================================================================
 * Description:
 *  This plugin creates a storage chest scene that integrates with
 *  YEP_ItemCore to display detailed item information. It allows
 *  depositing and withdrawing items, weapons, armors, and key items.
 *
 * ============================================================================
 * Plugin Commands (MV):
 * ============================================================================
 *
 *  OpenStorageChest
 *    - Opens the storage chest scene.
 *
 *  DepositItem [category] [itemId] [quantity]
 *    - Deposits an item or equipment into the chest.
 *    - 'category' can be: item, weapon, armor, keyItem
 *    - 'itemId' is the item's ID in the database.
 *    - 'quantity' is the amount to deposit.
 *
 *    Example for MV:
 *      DepositItem item 5 3
 *
 * ============================================================================
 * Plugin Commands (MZ):
 * ============================================================================
 *
 *  Use the integrated plugin commands in the MZ editor:
 *  - Open Chest
 *  - Deposit Item (with its arguments)
 *
 * ============================================================================
 * Script Call (MV & MZ):
 * ============================================================================
 *
 *  SceneManager.push(Scene_StorageChestYEP);
 *    - Opens the chest scene from a script call.
 *
 */

var Imported = Imported || {};
Imported.SHK_Storage_Unified = true;

(function() {
    'use strict';

    var pluginName = 'SHK_Storage_Unified_MV_MZ';

    // Reason: Verifies that YEP_ItemCore is loaded, as this plugin depends on its window classes.
    // Issues a warning and aborts initialization if the dependency is not found.
    if (!Imported || !Imported.YEP_ItemCore) {
        console.warn("YEP_ItemCore is not installed. This plugin requires YEP_ItemCore.");
        return;
    }

    // Reason: A global flag to prevent the scene from being pushed onto the stack multiple times,
    // which could lead to bugs or unexpected behavior.
    var StorageChest_IsOpen = false;

    // Reason: This object holds all stored items and serves as the core data structure
    // that will be managed by the game's save/load system.
    var storageChest = {
        item: {},
        weapon: {},
        armor: {},
        keyItem: {}
    };

    // --- Save System Integration ---
    // Reason: Hooks into the DataManager to include the storage chest data in save files.
    var _DataManager_makeSaveContents = DataManager.makeSaveContents;
    DataManager.makeSaveContents = function() {
        var contents = _DataManager_makeSaveContents.call(this);
        contents.storageChest = storageChest;
        return contents;
    };

    // Reason: Hooks into the DataManager to extract the storage chest data when loading a game.
    // Includes a fallback to initialize an empty chest if the save data is missing.
    var _DataManager_extractSaveContents = DataManager.extractSaveContents;
    DataManager.extractSaveContents = function(contents) {
        _DataManager_extractSaveContents.call(this, contents);
        if (contents.storageChest) {
            storageChest.item = contents.storageChest.item || {};
            storageChest.weapon = contents.storageChest.weapon || {};
            storageChest.armor = contents.storageChest.armor || {};
            storageChest.keyItem = contents.storageChest.keyItem || {};
        } else {
            storageChest = { item: {}, weapon: {}, armor: {}, keyItem: {} };
        }
    };
    
    // Reason: Ensures that the storage chest is reset to an empty state when a new game is started.
    var _DataManager_createGameObjects = DataManager.createGameObjects;
    DataManager.createGameObjects = function() {
        _DataManager_createGameObjects.call(this);
        storageChest = { item: {}, weapon: {}, armor: {}, keyItem: {} };
    };

    // Reason: A centralized helper function to handle the logic of adding an item to the storage chest.
    // It's used by both MV and MZ plugin commands to avoid code duplication.
    function depositItemFromCommand(category, itemId, quantity) {
        var item;
        switch (category) {
            case 'item':
            case 'keyItem':
                item = $dataItems[itemId];
                break;
            case 'weapon':
                item = $dataWeapons[itemId];
                break;
            case 'armor':
                item = $dataArmors[itemId];
                break;
            default:
                console.warn('Unknown category: ' + category);
                return;
        }
        if (!item) {
            console.warn('Item with ID ' + itemId + ' not found in category ' + category);
            return;
        }
        if (quantity <= 0) {
            console.warn("Invalid deposit quantity.");
            return;
        }
        if (!storageChest[category][item.id]) {
            storageChest[category][item.id] = {
                id: item.id,
                name: item.name,
                iconIndex: item.iconIndex,
                description: item.description,
                count: 0
            };
        }
        storageChest[category][item.id].count += quantity;
    }
    
    // --- Plugin Command Registration (Engine-Specific) ---
    // Reason: Uses engine detection to register commands using the appropriate method for either MZ
    // (PluginManager.registerCommand) or MV (aliasing Game_Interpreter.pluginCommand).
    if (Utils.RPGMAKER_NAME === 'MZ') {
        PluginManager.registerCommand(pluginName, 'OpenStorageChest', function() {
            if (!StorageChest_IsOpen) {
                StorageChest_IsOpen = true;
                SceneManager.push(Scene_StorageChestYEP);
            }
        });
        PluginManager.registerCommand(pluginName, 'DepositItem', function(args) {
            var category = args.category;
            var itemId = Number(args.itemId);
            var quantity = Number(args.quantity);
            depositItemFromCommand(category, itemId, quantity);
        });
    } else {
        var _Game_Interpreter_pluginCommand = Game_Interpreter.prototype.pluginCommand;
        Game_Interpreter.prototype.pluginCommand = function(command, args) {
            _Game_Interpreter_pluginCommand.call(this, command, args);
            if (command === 'OpenStorageChest') {
                if (!StorageChest_IsOpen) {
                    StorageChest_IsOpen = true;
                    SceneManager.push(Scene_StorageChestYEP);
                }
            }
            if (command === 'DepositItem') {
                var category = args[0];
                var itemId = Number(args[1]);
                var quantity = Number(args[2]);
                depositItemFromCommand(category, itemId, quantity);
            }
        };
    }
    
    // --- Shared Window & Scene Logic ---
    
    // Reason: Polyfill to add a helper function that converts a simple stored item object back
    // into a full database object ($dataItems, etc.), which is needed by YEP's windows.
    if (typeof Window_ItemList.prototype.convertToGameItem !== 'function') {
        Window_ItemList.prototype.convertToGameItem = function(storedItem) {
            switch (this._storageCategory) {
                case 'item': return $dataItems[storedItem.id];
                case 'weapon': return $dataWeapons[storedItem.id];
                case 'armor': return $dataArmors[storedItem.id];
                case 'keyItem': return $dataItems[storedItem.id];
                default: return null;
            }
        };
    }

    // Reason: Overrides the item list creation to populate it with items from the storage chest
    // when in 'retrieve' mode, instead of from the party's inventory.
    var _Window_ItemList_makeItemList = Window_ItemList.prototype.makeItemList;
    Window_ItemList.prototype.makeItemList = function() {
        if (SceneManager._scene instanceof Scene_StorageChestYEP && this._storageMode === 'retrieve') {
            this._data = [];
            var cat = this._storageCategory;
            if (storageChest[cat]) {
                for (var id in storageChest[cat]) {
                    if (storageChest[cat].hasOwnProperty(id) && storageChest[cat][id].count > 0) {
                        this._data.push(this.convertToGameItem(storageChest[cat][id]));
                    }
                }
            }
        } else {
            _Window_ItemList_makeItemList.call(this);
        }
    };
    
    //--------------------------------------------------------------------------
    // Scene_StorageChestYEP
    //--------------------------------------------------------------------------
    function Scene_StorageChestYEP() {
        this.initialize.apply(this, arguments);
    }
    window.Scene_StorageChestYEP = Scene_StorageChestYEP;
    
    Scene_StorageChestYEP.prototype = Object.create(Scene_Item.prototype);
    Scene_StorageChestYEP.prototype.constructor = Scene_StorageChestYEP;
    
    Scene_StorageChestYEP.prototype.initialize = function() {
        Scene_Item.prototype.initialize.call(this);
        this._closing = false;
        StorageChest_IsOpen = true;
    };

    Scene_StorageChestYEP.prototype.item = function() {
        return this._itemWindow.item();
    };

    Scene_StorageChestYEP.prototype.onItemOk = function() {
        this.useItem();
    };
    
    // Reason: Handler to return focus from the item list back to the category selection window.
    Scene_StorageChestYEP.prototype.onItemCancel = function() {
        if (this._categoryWindow) {
            this._categoryWindow.show();
            this._categoryWindow.activate();
        }
        this._itemWindow.deselect();
    };

    // Reason: Handler to return focus from the category window back to the main command window (Store/Retrieve).
    Scene_StorageChestYEP.prototype.onCategoryCancel = function() {
        if (this._categoryWindow) {
            this._categoryWindow.deactivate();
        }
        if (this._storageCommandWindow) {
            this._storageCommandWindow.show();
            this._storageCommandWindow.activate();
        }
    };

    // Reason: Handler to exit the scene entirely.
    Scene_StorageChestYEP.prototype.onCancel = function() {
        if (this._closing) return;
        this._closing = true;
        StorageChest_IsOpen = false;
        SceneManager.pop();
    };

    Scene_StorageChestYEP.prototype.create = function() {
        this.createWindowLayer();
        this.createHelpWindow();
        this.addWindow(this._helpWindow);
        Scene_Item.prototype.create.call(this);
        this.createStorageCommandWindow();
    
        if (this._storageCommandWindow) {
            this._storageCommandWindow.show();
            this._storageCommandWindow.activate();
        }
        if (this._categoryWindow) {
            this._categoryWindow.show();
            this._categoryWindow.deactivate();
        }
        if (this._itemWindow) {
            this._itemWindow.show();
            this._itemWindow.deactivate();
        }
    
        if (this._itemWindow) {
            this._itemWindow.setHandler('ok', this.onItemOk.bind(this));
            this._itemWindow.setHandler('cancel', this.onItemCancel.bind(this));
        }
        if (this._categoryWindow) {
            this._categoryWindow.setHandler('cancel', this.onCategoryCancel.bind(this));
            this._categoryWindow.setHandler('ok', this.onCategoryOk.bind(this));
        }
        if (this._actorWindow) {
            this._actorWindow.deactivate();
            this._actorWindow.hide();
        }
    };
    
    // Reason: Creates the custom 'Store'/'Retrieve'/'Cancel' command window for this scene.
    Scene_StorageChestYEP.prototype.createStorageCommandWindow = function() {
        var rect;
        // MV and MZ both support Rectangle objects for window creation.
        if (this._categoryWindow) {
            rect = new Rectangle(this._categoryWindow.x, this._categoryWindow.y, this._categoryWindow.width, this._categoryWindow.height);
        } else {
            var h = Window_Base.prototype.fittingHeight(1);
            rect = new Rectangle(0, this._helpWindow.height, Graphics.boxWidth, h);
        }
        this._storageCommandWindow = new Window_StorageCommand(rect);
        this.addWindow(this._storageCommandWindow);
    };

    Scene_StorageChestYEP.prototype.onCategoryOk = function() {
        var category = this._categoryWindow.currentSymbol();
        this._categoryWindow.deactivate();
        this._itemWindow._storageMode = this._storageMode;
        this._itemWindow._storageCategory = category;
        this._itemWindow.refresh();
        this._itemWindow.activate();
        this._itemWindow.selectLast();
    };

    Scene_StorageChestYEP.prototype.onStore = function() {
        this._storageMode = 'store';
        if (this._storageCommandWindow) {
            this._storageCommandWindow.hide();
            this._storageCommandWindow.deactivate();
        }
        if (this._categoryWindow) {
            this._categoryWindow.show();
            this._categoryWindow.activate();
        }
    };
    
    Scene_StorageChestYEP.prototype.onRetrieve = function() {
        this._storageMode = 'retrieve';
        if (this._storageCommandWindow) {
            this._storageCommandWindow.hide();
            this._storageCommandWindow.deactivate();
        }
        if (this._categoryWindow) {
            this._categoryWindow.show();
            this._categoryWindow.activate();
        }
    };
    
    // Reason: Triggered when an item is selected; pushes the number input scene.
    Scene_StorageChestYEP.prototype.useItem = function() {
        var item = this.item();
        if (!item) {
            SoundManager.playBuzzer();
            this._itemWindow.activate();
            return;
        }
        this._selectedItem = item;
        if (this._storageMode === 'store') {
            Scene_NumKeyboard.setHandler(this.onNumOkStore.bind(this));
        } else {
            Scene_NumKeyboard.setHandler(this.onNumOkRetrieve.bind(this));
        }
        SceneManager.push(Scene_NumKeyboard);
    };

    Scene_StorageChestYEP.prototype.onNumOkStore = function(quantity) {
        this.depositItem(this._selectedItem, quantity);
        this._itemWindow.refresh();
        var self = this;
        setTimeout(function() { if (self._itemWindow) self._itemWindow.activate(); }, 100);
    };

    Scene_StorageChestYEP.prototype.onNumOkRetrieve = function(quantity) {
        this.retrieveItem(this._selectedItem, quantity);
        this._itemWindow.refresh();
        var self = this;
        setTimeout(function() { if (self._itemWindow) self._itemWindow.activate(); }, 100);
    };

    // Reason: Handles the logic of moving an item from the party to the chest, respecting quantity and item limits.
    Scene_StorageChestYEP.prototype.depositItem = function(item, quantity) {
        var cat = this._categoryWindow.currentSymbol();
        var partyQty = $gameParty.numItems(item);
        var depositQty = Math.min(quantity, partyQty);
        if (depositQty <= 0) return;
        if (!storageChest[cat][item.id]) {
            storageChest[cat][item.id] = {
                id: item.id, name: item.name, iconIndex: item.iconIndex,
                description: item.description, count: 0
            };
        }
        storageChest[cat][item.id].count += depositQty;
        $gameParty.loseItem(item, depositQty);
    };

    // Reason: Handles the logic of moving an item from the chest to the party, respecting quantity and item limits.
    Scene_StorageChestYEP.prototype.retrieveItem = function(item, quantity) {
        var cat = this._categoryWindow.currentSymbol();
        if (!storageChest[cat][item.id]) return;
        var data = storageChest[cat][item.id];
        if (data.count <= 0) return;
        var available = data.count;
        var canTake = $gameParty.maxItems(item) - $gameParty.numItems(item);
        var retrieveQty = Math.min(quantity, available, canTake);
        if (retrieveQty > 0) {
            data.count -= retrieveQty;
            if (data.count <= 0) delete storageChest[cat][item.id];
            $gameParty.gainItem(item, retrieveQty);
        }
    };
    
    // Reason: Overrides the `includes` method to filter the item list based on the current mode. In 'store'
    // mode, it shows party items. In 'retrieve' mode, it only shows items present in the chest.
    var _Window_ItemList_includes = Window_ItemList.prototype.includes;
    Window_ItemList.prototype.includes = function(item) {
        if (!(SceneManager._scene instanceof Scene_StorageChestYEP)) {
            return _Window_ItemList_includes.call(this, item);
        }
        if (this._storageMode === 'store') {
            var cat = this._storageCategory;
            if (!cat || !item) return false;
            if (cat === 'item') {
                return DataManager.isItem(item) && item.itypeId === 1;
            } else if (cat === 'weapon') {
                return DataManager.isWeapon(item) && !$gameParty.isAnyMemberEquipped(item);
            } else if (cat === 'armor') {
                return DataManager.isArmor(item) && !$gameParty.isAnyMemberEquipped(item);
            } else if (cat === 'keyItem') {
                return DataManager.isItem(item) && item.itypeId === 2;
            }
        }
        if (this._storageMode === 'retrieve') {
            var cat = this._storageCategory;
            if (!cat || !item) return false;
            return !!storageChest[cat][item.id];
        }
        return false;
    };

    // Reason: Modifies number drawing. In 'retrieve' mode, it draws the quantity from the
    // storage chest data instead of from the party's inventory.
    var _Window_ItemList_drawItemNumber = Window_ItemList.prototype.drawItemNumber;
    Window_ItemList.prototype.drawItemNumber = function(item, x, y, width) {
        if (SceneManager._scene instanceof Scene_StorageChestYEP && this._storageMode === 'retrieve') {
            var cat = this._storageCategory;
            var data = storageChest[cat] ? storageChest[cat][item.id] : null;
            if (data) {
                this.drawText('x' + data.count, x, y, width, 'right');
                return;
            }
        }
        _Window_ItemList_drawItemNumber.call(this, item, x, y, width);
    };

    // --- Window_StorageCommand (MV & MZ Compatibility Fix) ---
    // Reason: A custom command window for the main storage options.
    function Window_StorageCommand() {
        this.initialize.apply(this, arguments);
    }
    window.Window_StorageCommand = Window_StorageCommand;
    
    Window_StorageCommand.prototype = Object.create(Window_Command.prototype);
    Window_StorageCommand.prototype.constructor = Window_StorageCommand;
    
    // Reason: The constructor handles differences between MV and MZ. In MV, the base constructor expects
    // x/y coordinates, while MZ expects a Rectangle object. This code handles both cases.
    Window_StorageCommand.prototype.initialize = function(rect) {
        this._rect = rect; // Store rect for use in MV.
        if (Utils.RPGMAKER_NAME === 'MZ') {
            Window_Command.prototype.initialize.call(this, rect);
        } else {
            // In MV, the constructor calls windowWidth/Height internally, so we use the x/y constructor.
            Window_Command.prototype.initialize.call(this, rect.x, rect.y);
        }
        this.setHandler('store',    SceneManager._scene.onStore.bind(SceneManager._scene));
        this.setHandler('retrieve', SceneManager._scene.onRetrieve.bind(SceneManager._scene));
        this.setHandler('cancel',   SceneManager._scene.onCancel.bind(SceneManager._scene));
    };

    // Override for MV to ensure it uses the correct size from the rect object.
    Window_StorageCommand.prototype.windowWidth = function() {
        return this._rect ? this._rect.width : 240;
    };

    Window_StorageCommand.prototype.windowHeight = function() {
        return this._rect ? this._rect.height : this.fittingHeight(this.numVisibleRows());
    };

    Window_StorageCommand.prototype.maxCols = function() { return 1; };
    Window_StorageCommand.prototype.numVisibleRows = function() { return 3; };
    Window_StorageCommand.prototype.makeCommandList = function() {
        this.addCommand('Depositar', 'store');
        this.addCommand('Retirar', 'retrieve');
        this.addCommand('Cancelar', 'cancel');
    };

    // --- Scene_NumKeyboard: A custom scene to provide a numeric keypad for entering quantities. ---
    function Scene_NumKeyboard() { this.initialize.apply(this, arguments); }
    window.Scene_NumKeyboard = Scene_NumKeyboard;
    
    Scene_NumKeyboard._callback = null;
    Scene_NumKeyboard.setHandler = function(callback) { Scene_NumKeyboard._callback = callback; };
    Scene_NumKeyboard.prototype = Object.create(Scene_MenuBase.prototype);
    Scene_NumKeyboard.prototype.constructor = Scene_NumKeyboard;
    Scene_NumKeyboard.prototype.initialize = function() {
        Scene_MenuBase.prototype.initialize.call(this);
        this._callback = Scene_NumKeyboard._callback;
        Scene_NumKeyboard._callback = null;
        this._number = "";
    };
    Scene_NumKeyboard.prototype.create = function() {
        Scene_MenuBase.prototype.create.call(this);
        this.createDisplayWindow();
        this.createKeypadWindow();
    };
    Scene_NumKeyboard.prototype.createDisplayWindow = function() {
        var rect = new Rectangle(0, 0, Graphics.boxWidth, 100);
        this._displayWindow = new Window_Base(rect.x, rect.y, rect.width, rect.height);
        this.addWindow(this._displayWindow);
        this.refreshDisplay();
    };
    Scene_NumKeyboard.prototype.refreshDisplay = function() {
        this._displayWindow.contents.clear();
        var text = "Cantidad: " + (this._number === "" ? "0" : this._number);
        this._displayWindow.drawText(text, 0, 0, this._displayWindow.contentsWidth(), "left");
    };
    Scene_NumKeyboard.prototype.createKeypadWindow = function() {
        var rect = new Rectangle(0, 0, 0, 0); // MZ-style rect
        this._keypadWindow = new Window_NumKeypad(rect);
        this._keypadWindow.setHandler('ok', this.onOk.bind(this));
        this._keypadWindow.setHandler('cancel', this.onCancel.bind(this));
        this.addWindow(this._keypadWindow);
    };
    Scene_NumKeyboard.prototype.onOk = function() {
        var value = Number(this._number) || 0;
        if (this._callback) { this._callback(value); }
        SceneManager.pop();
    };
    Scene_NumKeyboard.prototype.onCancel = function() { SceneManager.pop(); };
    Scene_NumKeyboard.prototype.appendNumber = function(digit) {
        if (this._number.length < 5) { this._number += digit; this.refreshDisplay(); }
    };
    Scene_NumKeyboard.prototype.backspace = function() {
        this._number = this._number.slice(0, -1);
        this.refreshDisplay();
    };

    // --- Window_NumKeypad: The command window that acts as a numeric keypad. ---
    function Window_NumKeypad() { this.initialize.apply(this, arguments); }
    window.Window_NumKeypad = Window_NumKeypad;
    
    Window_NumKeypad.prototype = Object.create(Window_Command.prototype);
    Window_NumKeypad.prototype.constructor = Window_NumKeypad;
    Window_NumKeypad.prototype.initialize = function(rect) {
        var x = Graphics.boxWidth / 2 - this.windowWidth() / 2;
        var y = 100;
        if (Utils.RPGMAKER_NAME === 'MZ') {
            rect.x = x; rect.y = y; rect.width = this.windowWidth(); rect.height = this.windowHeight();
            Window_Command.prototype.initialize.call(this, rect);
        } else {
            Window_Command.prototype.initialize.call(this, x, y);
        }
    };
    Window_NumKeypad.prototype.windowWidth = function() { return 400; };
    Window_NumKeypad.prototype.windowHeight = function() { return this.fittingHeight(4); };
    Window_NumKeypad.prototype.makeCommandList = function() {
        this.addCommand("1", "digit"); this.addCommand("2", "digit"); this.addCommand("3", "digit"); this.addCommand("Borrar", "backspace");
        this.addCommand("4", "digit"); this.addCommand("5", "digit"); this.addCommand("6", "digit"); this.addCommand("OK", "ok");
        this.addCommand("7", "digit"); this.addCommand("8", "digit"); this.addCommand("9", "digit"); this.addCommand("Cancelar", "cancel");
        this.addCommand("0", "digit");
    };
    Window_NumKeypad.prototype.itemTextAlign = function() { return 'center'; };
    Window_NumKeypad.prototype.maxCols = function() { return 4; };
    Window_NumKeypad.prototype.drawItem = function(index) {
        var rect = this.itemRectForText(index);
        this.drawText(this.commandName(index), rect.x, rect.y, rect.width, 'center');
    };
    Window_NumKeypad.prototype.processOk = function() {
        var symbol = this.commandSymbol(this.index());
        if (symbol === 'digit') { SceneManager._scene.appendNumber(this.commandName(this.index()));
        } else if (symbol === 'backspace') { SceneManager._scene.backspace();
        } else if (symbol === 'ok') { this.callHandler('ok');
        } else if (symbol === 'cancel') { this.callHandler('cancel'); }
        this.activate();
    };
    Window_NumKeypad.prototype.isCancelEnabled = function() { return true; };

})();