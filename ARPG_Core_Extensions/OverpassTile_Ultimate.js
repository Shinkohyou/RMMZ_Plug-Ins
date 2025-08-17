/*:
 * @target MZ
 * @plugindesc (v6.2.0) The ultimate Overpass/Bridge package for DotMove & ARPG systems.
 * @author Shinkohyou, Gemini (Assistant)
 * @base PluginCommonBase
 * @base DotMoveSystem
 * @orderAfter DotMoveSystem
 * @orderAfter DotMoveSystem_FunctionEx
 * @orderAfter CharacterCollisionEx
 * @orderAfter ARPG_Core
 * @url https://github.com/Shinkohyou/RMMZ_Plug-Ins
 *
 * @param overPathRegion
 * @text Overpass Region ID(s)
 * @default 0
 * @type text
 * @desc Region IDs for bridges. Use commas for multiple IDs (e.g., 1,2,5).
 *
 * @param overPathTerrainTag
 * @text Overpass Terrain Tag(s)
 * @default 0
 * @type text
 * @desc Terrain tags for bridges. Use commas for multiple tags (e.g., 1,2).
 *
 * @param gatewayRegion
 * @text Gateway Region ID(s)
 * @default 0
 * @type text
 * @desc Region IDs for bridge entrances. Use commas for multiple IDs.
 *
 * @param gatewayTerrainTag
 * @text Gateway Terrain Tag(s)
 * @default 0
 * @type text
 * @desc Terrain tags for bridge entrances. Use commas for multiple tags.
 *
 * @help
 * OverpassTile_Ultimate.js
 *
 * This plugin is a unified, definitive version that combines multiple
 * features to create an advanced bridge and layering system, compatible
 * with pixel-movement (DotMove) and ARPG systems.
 *
 * --- INTEGRATED FEATURES ---
 * Ultimate Hybrid Version (v6.2.0):
 * - FIXED: Terrain tags now work correctly for defining bridges and
 *   gateways, including support for multiple IDs.
 * - Full compatibility with DotMoveSystem and ARPG_Core.
 * - Precise layer-based collision logic (NRP-style).
 * - Collision filter for DotMoveSystem that respects layers.
 * - Fix for rendering on looping maps.
 * - Filters for ARPG_Core to prevent attacks and damage while in vehicles.
 *
 * --- ARPG_Core Compatibility ---
 * This plugin automatically detects if "ARPG_Core.js" is installed and
 * enables the following compatibility features:
 *
 * 1. Vertical Layer Damage Filter:
 *    - Attacks and skills cannot damage targets that are on a different
 *      vertical layer (e.g., an enemy on a bridge cannot damage the
 *      player passing underneath).
 *
 * 2. Vehicle Protection:
 *    - The player cannot receive damage while in a vehicle.
 *    - The player cannot use skills or attack while in a vehicle.
 *
 * For this compatibility to function, this plugin needs to access the
 * "ARPG_Battler" class exposed by ARPG_Core.js.
 * 
 * --- CREDITS AND BASIS ---
 * This plugin would not have been possible without the work of several authors:
 * - Triacontane & Yoji Ojima: Creators of the official OverpassTile.js for MZ,
 *   which served as the foundation for this evolution. Triacontane also
 *   created the patch for looping maps.
 * - NRP (Takeshi Sunagawa): Creator of NRP_OverpassTile.js and NRP_BushEX,
 *   from which the advanced height-based collision logic was adapted.
 */

// Date: 2025/08/13
// Reason: This plugin is a unified, definitive version that combines multiple
// features to create an advanced bridge and layering system, compatible
// with pixel-movement (DotMove) and ARPG systems.
//-----------------------------------------------------------------------------
(() => {
'use strict';

const script = document.currentScript;
const param  = PluginManagerEx.createParameter(script);

//=============================================================================
// Game_Map - Check Utilities (Corrected)
//=============================================================================

// *** CORRECTED FUNCTION ***
// Reason: This robust version properly handles multiple comma-separated IDs for both
// regions and terrain tags, and correctly converts string inputs to numbers for reliable checks.
Game_Map.prototype.isRegionOrTerrainTag = function(x, y, regionIds, terrainTags) {
    if (!this.isValid(x, y)) return false;

    // Region Check
    if (regionIds && String(regionIds) !== '0') {
        const regionIdArray = String(regionIds).split(',');
        const currentRegionId = this.regionId(x, y);
        for (const id of regionIdArray) {
            if (Number(id) > 0 && currentRegionId == Number(id.trim())) {
                return true;
            }
        }
    }

    // Terrain Tag Check
    if (terrainTags && String(terrainTags) !== '0') {
        const terrainTagArray = String(terrainTags).split(',');
        const currentTerrainTag = this.terrainTag(x, y);
        for (const tag of terrainTagArray) {
            if (Number(tag) > 0 && currentTerrainTag == Number(tag.trim())) {
                return true;
            }
        }
    }

    return false;
};

// Reason: A wrapper function to check if a tile is part of an overpass using plugin parameters.
Game_Map.prototype.isOverPath = function(x, y) {
    return this.isRegionOrTerrainTag(x, y, param.overPathRegion, param.overPathTerrainTag);
};

// Reason: A wrapper function to check if a tile is an overpass gateway using plugin parameters.
Game_Map.prototype.isGatewayOverPath = function(x, y) {
    return this.isRegionOrTerrainTag(x, y, param.gatewayRegion, param.gatewayTerrainTag);
};

//=============================================================================
// Game_CharacterBase - Level and Passability Management
//=============================================================================

const _GCB_initMembers = Game_CharacterBase.prototype.initMembers;
Game_CharacterBase.prototype.initMembers = function() {
    _GCB_initMembers.apply(this, arguments);
    this._higher = false; // Initializes the character's vertical layer state.
};

Game_CharacterBase.prototype.isOnGateway = function() {
    return $gameMap.isGatewayOverPath(this.x, this.y);
};

Game_CharacterBase.prototype.isOnOverPath = function() {
    return $gameMap.isOverPath(this.x, this.y);
};

// Reason: Updates the character's vertical layer state (`_higher`). A character is considered
// 'higher' if they are on a gateway or have transitioned onto a bridge.
Game_CharacterBase.prototype.updateOverPath = function() {
    if (this.isOnGateway()) {
        this._higher = true;
    } else if (!this.isOnOverPath()) {
        this._higher = false;
    }
};

// Reason: A specific version of the update logic for when a character is placed directly
// on a tile (e.g., via event command or after disembarking a vehicle).
Game_CharacterBase.prototype.updateOverPathOnLocate = function() {
    this._higher = this.isOnOverPath() || this.isOnGateway();
};

// Reason: Returns the numerical height level of the character, crucial for collision logic.
// 2: On top of a bridge. 1: On a gateway tile. 0: Normal ground. -1: Under a bridge.
Game_CharacterBase.prototype.getHigherLevel = function() {
    if (!this._higher) return this.isOnOverPath() ? -1 : 0;
    return this.isOnOverPath() ? 2 : 1;
};

// NRP Filter - Precise layer-based collision logic.
// Reason: Determines if two characters can interact. Returns true if they are on the same
// height level, or if one is on the ground (0) and the other is under a bridge (-1).
Game_CharacterBase.prototype.isSameHigher = function(target) {
    if (!target) return false;
    const myLvl = this.getHigherLevel();
    const tgtLvl = target.getHigherLevel();
    if (myLvl === tgtLvl) return true; // Same height
    if ((myLvl === 0 && tgtLvl === -1) || (myLvl === -1 && tgtLvl === 0)) return true; // Ground <-> Underpass
    return false;
};

Game_CharacterBase.prototype.isHigherPriority = function() {
    return !!this._higher;
};

const _GCB_isMapPassable = Game_CharacterBase.prototype.isMapPassable;
Game_CharacterBase.prototype.isMapPassable = function(x, y, d) {
    const passable = this.isMapPassableOnOverPath(x, y, d);
    if (passable !== undefined) return passable;
    return _GCB_isMapPassable.apply(this, arguments);
};

// Reason: Injects overpass passability logic. This allows movement from gateways to bridges,
// between bridge tiles, and prevents illegal transitions from the ground to a bridge side.
Game_CharacterBase.prototype.isMapPassableOnOverPath = function(x, y, d) {
    const overPath = $gameMap.isOverPath(x, y);
    const gateway = $gameMap.isGatewayOverPath(x, y);
    const nx = $gameMap.roundXWithDirection(x, d);
    const ny = $gameMap.roundYWithDirection(y, d);
    const nextOverPath = $gameMap.isOverPath(nx, ny);
    const nextGateway = $gameMap.isGatewayOverPath(nx, ny);

    if (gateway && nextOverPath) return true;
    if (overPath) {
        if (this._higher) return nextOverPath || nextGateway;
        if (nextGateway) return false;
    }
    return undefined;
};

const _GCB_isCollidedWithEvents = Game_CharacterBase.prototype.isCollidedWithEvents;
Game_CharacterBase.prototype.isCollidedWithEvents = function(x, y) {
    return _GCB_isCollidedWithEvents.apply(this, arguments) && this.isCollidedWithSameHigherEvents(x, y);
};

// Reason: Extends event collision checks to only trigger for events on a compatible vertical layer.
Game_CharacterBase.prototype.isCollidedWithSameHigherEvents = function(x, y) {
    const events = $gameMap.eventsXyNt(x, y);
    return events.some(ev => this.isSameHigher(ev));
};

const _GCB_refreshBushDepth = Game_CharacterBase.prototype.refreshBushDepth;
Game_CharacterBase.prototype.refreshBushDepth = function() {
    _GCB_refreshBushDepth.apply(this, arguments);
    this.updateOverPath();
};

const _GCB_screenZ = Game_CharacterBase.prototype.screenZ;
Game_CharacterBase.prototype.screenZ = function() {
    const z = _GCB_screenZ.apply(this, arguments);
    // Reason: Increases the sprite's Z-index to ensure it renders above characters on lower layers.
    return this.isHigherPriority() ? z + 3 : z;
};

//=============================================================================
// Game_Player & Game_Event - Corrections
//=============================================================================

// Reason: Prevents the player from taking floor damage while on a bridge.
const _GP_isOnDamageFloor = Game_Player.prototype.isOnDamageFloor;
Game_Player.prototype.isOnDamageFloor = function() {
    if (this.isHigherPriority()) return false;
    return _GP_isOnDamageFloor.apply(this, arguments);
};

// Reason: Prevents events from triggering (on touch, etc.) if the player is on a different vertical layer.
const _GE_start = Game_Event.prototype.start;
Game_Event.prototype.start = function() {
    if (this.isTriggerIn([0,1,2]) && $gamePlayer && !this.isSameHigher($gamePlayer)) return;
    _GE_start.apply(this, arguments);
};

// Reason: Prevents event-player collision if they are on different vertical layers.
const _GE_isCollidedWithPlayerCharacters = Game_Event.prototype.isCollidedWithPlayerCharacters;
Game_Event.prototype.isCollidedWithPlayerCharacters = function(x, y) {
    if ($gamePlayer && !this.isSameHigher($gamePlayer)) return false;
    return _GE_isCollidedWithPlayerCharacters.apply(this, arguments);
};

//=============================================================================
// Game_Followers & Tilemap
//=============================================================================

// Reason: A helper to apply the `updateOverPathOnLocate` logic to all party followers simultaneously.
Game_Followers.prototype.updateOverPathOnLocate = function() {
    this._data.forEach(f => f.updateOverPathOnLocate());
};

// *** LOOPING MAP FIX ***
// Reason: Patches tilemap logic to correctly handle modulo arithmetic for map coordinates.
// This ensures overpass detection works seamlessly on maps that loop horizontally or vertically.
Tilemap.prototype._isOverpassPosition = function(mx, my) {
    if (this.horizontalWrap) mx = mx.mod(this._mapWidth);
    if (this.verticalWrap) my = my.mod(this._mapHeight);
    return $gameMap && $gameMap.isOverPath(mx, my);
};

//=============================================================================
// DotMoveSystem.CharacterCollisionChecker - Adaptations
//=============================================================================

if (window.DotMoveSystem && DotMoveSystem.CharacterCollisionChecker) {
    // Reason: Injects overpass logic into pixel-movement passability checks.
    const _DMS_CCC_checkPassMass = DotMoveSystem.CharacterCollisionChecker.prototype.checkPassMass;
    DotMoveSystem.CharacterCollisionChecker.prototype.checkPassMass = function(ix, iy, d) {
        const character = this._character;
        const fromPoint = DotMoveSystem.DotMoveUtils.prevPointWithDirection(new DotMoveSystem.DotMovePoint(ix, iy), d);
        
        const fromIsGateway = $gameMap.isGatewayOverPath(fromPoint.x, fromPoint.y);
        const fromIsOverPath = $gameMap.isOverPath(fromPoint.x, fromPoint.y);
        const toIsGateway = $gameMap.isGatewayOverPath(ix, iy);
        const toIsOverPath = $gameMap.isOverPath(ix, iy);

        if (fromIsGateway && toIsOverPath) return true;
        if (fromIsOverPath) {
            if (character.isHigherPriority()) return toIsOverPath || toIsGateway || _DMS_CCC_checkPassMass.call(this, ix, iy, d);
            if (toIsGateway) return false;
        }
        return _DMS_CCC_checkPassMass.call(this, ix, iy, d);
    };

    // Reason: Injects layer checking into pixel-movement character collision checks.
    const _DMS_CCC_checkCharacter = DotMoveSystem.CharacterCollisionChecker.prototype.checkCharacter;
    DotMoveSystem.CharacterCollisionChecker.prototype.checkCharacter = function(x, y, d, character) {
        if (this._character && character && !this._character.isSameHigher(character)) {
            return null;
        }
        return _DMS_CCC_checkCharacter.call(this, x, y, d, character);
    };
}

//=============================================================================
// ARPG_Core - Damage and Attack Filters (with Vehicle Protection)
//=============================================================================

if (window.ARPG_Battler) {
    // Reason: Filters incoming damage to prevent attacks between different vertical layers
    // and to make the player invincible while inside a vehicle.
    const _ARPG_Battler_recvDamage = ARPG_Battler.prototype.recvDamage;
    ARPG_Battler.prototype.recvDamage = function(damageEffect) {
        const subject = damageEffect.subject();
        const targetUser = this.user();

        if (targetUser === $gamePlayer && $gamePlayer.isInVehicle()) return;
        if (subject && subject.user && !targetUser.isSameHigher(subject.user())) return;
        
        _ARPG_Battler_recvDamage.apply(this, arguments);
    };

    // Reason: Prevents the player from using skills while piloting a vehicle.
    const _ARPG_Battler_canUsableSkill = ARPG_Battler.prototype.canUsableSkill;
    ARPG_Battler.prototype.canUsableSkill = function() {
        if (this.user() === $gamePlayer && $gamePlayer.isInVehicle()) {
            return false;
        }
        return _ARPG_Battler_canUsableSkill.apply(this, arguments);
    };
}

})();