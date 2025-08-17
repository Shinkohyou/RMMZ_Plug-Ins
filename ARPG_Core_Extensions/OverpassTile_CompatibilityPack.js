/*:
 * @target MZ
 * @plugindesc (v2.0.0) Compatibility Pack for OverpassTile_Ultimate.js.
 * @author Shinkohyou, Gemini (Assistant)
 * @base OverpassTile_Ultimate
 * @orderAfter NRP_BushEX
 * @orderAfter OverpassTile_Ultimate
 * @url https://github.com/Shinkohyou/RMMZ_Plug-Ins
 *
 * @help
 * OverpassTile_CompatibilityPack.js
 * 
 * This plugin contains all necessary patches for the main
 * "OverpassTile_Ultimate.js" plugin to work correctly with other complex systems.
 *
 * REPLACES AND MAKES THE FOLLOWING PLUGINS OBSOLETE:
 * - OverpassTileVehicleAttach.js
 * - All previous compatibility patches for OverpassTile.
 *
 * --- INTEGRATED FEATURES ---
 * 1. NRP_BushEX Compatibility: Prevents bush effects from applying
 *    to characters on upper layers.
 * 2. Floor Damage Fix: Prevents characters from taking floor damage
 *    (e.g., lava, poison) while on a bridge.
 * 3. Complete Vehicle System: Boarding, disembarking, and movement logic
 *    is fully compatible with the layering system and DotMoveSystem.
 *
 * --- CREDITS AND BASIS ---
 * The logic in this pack is adapted from the work of:
 * - Triacontane (OverpassTileVehicleAttach.js)
 * - NRP (Takeshi Sunagawa) (NRP_BushEX.js)
 */

// Date: 2025/08/13
// Reason: This plugin contains all necessary patches for the main
// "OverpassTile_Ultimate.js" plugin to work correctly with other complex systems
// like NRP_BushEX and the core vehicle system.
//-----------------------------------------------------------------------------
(() => {
    'use strict';

    // --- SECTION 1: COMPATIBILITY WITH NRP_BushEX AND FLOOR EFFECTS ---

    // Reason: These patches are applied only if the core overpass functions exist,
    // ensuring the main plugin is active.
    if (typeof Game_CharacterBase.prototype.updateOverPath === 'function') {
        // Reason: Prevents characters on an upper layer (a bridge) from triggering
        // bush effects from tiles on the ground layer below.
        const _Game_CharacterBase_refreshBushDepth_compat = Game_CharacterBase.prototype.refreshBushDepth;
        Game_CharacterBase.prototype.refreshBushDepth = function() {
            _Game_CharacterBase_refreshBushDepth_compat.apply(this, arguments);
            if (this.updateOverPath) this.updateOverPath();
            if (this.isHigherPriority && this.isHigherPriority()) {
                this._bushDepth = 0;
                if (typeof this.clearFloat === 'function') this.clearFloat();
            }
        };

        // Reason: Prevents actors from taking damage from floor tiles (e.g., lava, poison)
        // when they are safely on a bridge above those tiles.
        if (typeof Game_Actor !== 'undefined' && typeof Game_Actor.prototype.executeFloorDamage !== 'undefined') {
            const _Game_Actor_executeFloorDamage = Game_Actor.prototype.executeFloorDamage;
            Game_Actor.prototype.executeFloorDamage = function() {
                if ($gamePlayer.isHigherPriority()) return;
                _Game_Actor_executeFloorDamage.call(this);
            };
        }
    }
    
    // --- SECTION 2: COMPLETE AND CORRECTED VEHICLE SYSTEM ---

    // Reason: This entire section applies only if both DotMoveSystem and the overpass
    // layering system are active, as it deals with their interaction.
    if (window.DotMoveSystem && Game_CharacterBase.prototype.getHigherLevel) {

        // Corrected Height Logic for Vehicles
        Game_Vehicle.prototype.updateOverPath = function() {
            Game_Character.prototype.updateOverPath.call(this);
            if (this.isAirship()) {
                // An airship is always considered to be on the highest layer.
                this._higher = true;
            } else {
                // Restored logic for boats and ships to correctly determine if they are on a bridge.
                this._higher = (this.isOnOverPath && this.isOnOverPath()) || (this.isOnGateway && this.isOnGateway()) ? this.getHigherLevel() > 0 : false;
            }
        };

        // Reason: This collision check ensures the player can only interact with (e.g., board) a
        // vehicle if they are on the same vertical layer.
        const _Game_Vehicle_pos = Game_Vehicle.prototype.pos;
        Game_Vehicle.prototype.pos = function(x, y) {
            if (this.isAirship() && $gamePlayer.getHigherLevel() === 0 && this.getHigherLevel() === 2) {
                return Game_Character.prototype.pos.call(this, x, y);
            }
            if (!this.isSameHigher($gamePlayer)) return false;
            return _Game_Vehicle_pos.apply(this, arguments);
        };

        // Definitive, Layer-Aware Landing Logic (Corrected)
        Game_Vehicle.prototype.isLandOk = function(x, y, d) {
            if (this.isAirship()) {
                const x_int = Math.floor(x);
                const y_int = Math.floor(y);

                if (!$gameMap.isOverPath(x_int, y_int)) return false;
                if ($gameMap.eventsXyNt(x_int, y_int).some(event => event.getHigherLevel() === 2)) return false;
                if (!this.isOverpassPassable(x_int, y_int, d)) return false;
                
                return true;
            } else { // Logic for Boats and Ships
                const x2 = $gameMap.roundXWithDirection(x, d);
                const y2 = $gameMap.roundYWithDirection(y, d);
                if (!$gameMap.isValid(x2, y2)) return false;
                if (!$gameMap.isPassable(x2, y2, this.reverseDir(d))) return false;
                if (this.isCollidedWithCharacters(x2, y2)) return false;
                return true;
            }
        };
        
        // Helper function for `isLandOk` (Corrected).
        // Reason: Checks tile flags to determine if an airship is allowed to land on a specific overpass tile.
        Game_Vehicle.prototype.isOverpassPassable = function(x, y, d) {
            const flags = $gameMap.tilesetFlags();
            const upperLayerTiles = $gameMap.layeredTiles(x, y).slice(0, 2); 
            // For landing, the "entry" direction is always from above (direction 2 -> down).
            const bit = (1 << (2 / 2 - 1)) & 0x0f; // Bit for the "down" direction.

            for (const tileId of upperLayerTiles) {
                if (tileId === 0) continue;
                const flag = flags[tileId];
                if ((flag & 0x10) !== 0) continue; // Ignore '*' flag
                // Check if the passability bit for "entering from above" is blocked.
                if ((flag & bit) === bit) return false;
            }
            return true; 
        };

        // Reason: After disembarking (especially from an airship onto a bridge), this forces
        // an update of the player's layer status to ensure it's immediately correct.
        const _Game_Vehicle_getOff = Game_Vehicle.prototype.getOff;
        Game_Vehicle.prototype.getOff = function() {
            _Game_Vehicle_getOff.apply(this, arguments);
            if (this.isAirship()) {
                $gamePlayer.updateOverPathOnLocate();
                $gamePlayer.followers().updateOverPathOnLocate();
            }
        };

        // Reason: Syncs the player's `_higher` state with the airship's while piloting it.
        const _Game_Player_updateVehicle = Game_Player.prototype.updateVehicle;
        Game_Player.prototype.updateVehicle = function() {
            _Game_Player_updateVehicle.call(this);
            if (this.isInAirship()) {
                this._higher = this.vehicle().isHigherPriority();
            }
        };

        // Reason: The player-side logic for getting off a vehicle, ensuring landing conditions are met.
        Game_Player.prototype.getOffVehicle = function() {
            if (this.vehicle().isLandOk(this.x, this.y, this.direction())) {
                if (this.isInAirship()) this.setDirection(2);
                this._followers.synchronize(this.x, this.y, this.direction());
                this.vehicle().getOff();
                if (!this.isInAirship()) this.dotMoveGetOffVehicle();
                else this.locate(this.x, this.y);
                this._vehicleGettingOff = true;
                this.setMoveSpeed(4);
                this.setThrough(false);
                this.makeEncounterCount();
                this.gatherFollowers();
            }
            return this._vehicleGettingOff;
        };

        // Reason: Provides a custom pixel-movement command to correctly position the player
        // one tile away from the vehicle, as the default tile-based logic is insufficient for DotMove.
        Game_Player.prototype.dotMoveGetOffVehicle = function() {
            const d = this.direction();
            const targetX = $gameMap.roundXWithDirection(this.x, d);
            const targetY = $gameMap.roundYWithDirection(this.y, d);
            const originalThrough = this.isThrough();
            this.setThrough(true); 
            this.mover().moveToTarget(new DotMoveSystem.DotMovePoint(targetX, targetY));
            this.setThrough(originalThrough);
            this.setTransparent(false);
        };
    }
})();

//=============================================================================
//=============================================================================
// Reason: Enhances the visuals of the parked airship when used with the OverpassTile
// system. It fixes shadow projection, ensures continuous animation, and corrects
// visual layering issues to provide a more polished appearance.
//-----------------------------------------------------------------------------
/*
 * FEATURES:
 * 1. Correct Z-Index: Airship and shadow are always rendered above the player.
 * 2. Always-Visible Shadow at the Correct Distance.
 * 3. Continuous Hovering Animation.
 */
(() => {
'use strict';

//=============================================================================
// Game_Vehicle - Visual and State Logic
//=============================================================================

// Reason: A helper function to determine if the vehicle is present on the
// currently active map. This is crucial for deciding whether to render its
// associated sprites, like the shadow.
Game_Vehicle.prototype.isOnCurrentMap = function() {
    return this._mapId === $gameMap.mapId();
};

// --- 1. Continuous Animation ---
const _Game_Vehicle_updateAirship = Game_Vehicle.prototype.updateAirship;
Game_Vehicle.prototype.updateAirship = function() {
    _Game_Vehicle_updateAirship.call(this);
    // Reason: Forces the step animation (propellers) to remain active at all
    // times, ensuring the parked airship hovers visually instead of appearing static.
    this.setStepAnime(true);
};

// --- 2. Correct Shadow Distance ---
const _Game_Vehicle_shadowY = Game_Vehicle.prototype.shadowY;
Game_Vehicle.prototype.shadowY = function() {
    // Reason: Overrides the shadow's Y-coordinate calculation. When the airship is
    // parked, this applies a fixed vertical offset to the shadow, making it
    // appear as if cast from a height, rather than being directly beneath the sprite.
    if (this.isAirship() && !this._driving) {
        const th = $gameMap.tileHeight();
        return Game_Character.prototype.screenY.call(this) + th / 2;
    }
    // For all other cases, use the original logic (which depends on _altitude).
    return _Game_Vehicle_shadowY.apply(this, arguments);
};

const _Game_Vehicle_shadowOpacity = Game_Vehicle.prototype.shadowOpacity;
Game_Vehicle.prototype.shadowOpacity = function() {
    if (this.isAirship()) {
        // Reason: Ensures the airship's shadow is always fully opaque, providing a
        // clear visual indicator of its position, unlike the default behavior which can fade it.
        return 255;
    }
    return _Game_Vehicle_shadowOpacity.apply(this, arguments);
};

// --- 3. Correct Z-Index ---
const _Game_Vehicle_screenZ = Game_Vehicle.prototype.screenZ;
Game_Vehicle.prototype.screenZ = function() {
    // Reason: Assigns a high Z-index (8) to the parked airship. This ensures it
    // renders on top of the player and other low-priority characters, preventing
    // visual layering issues.
    if (this.isAirship() && !this._driving) {
        return 8;
    }
    return _Game_Vehicle_screenZ.apply(this, arguments);
};


//=============================================================================
// Spriteset_Map - Shadow Visibility Control
//=============================================================================

const _Spriteset_Map_updateShadow = Spriteset_Map.prototype.updateShadow;
Spriteset_Map.prototype.updateShadow = function() {
    _Spriteset_Map_updateShadow.apply(this, arguments);
    
    if (this._shadowSprite) {
        const airship = $gameMap.airship();
        // --- 4. Shadow Visibility ---
        // Reason: This patch makes the airship's shadow visible only if the airship
        // itself is present on the current map, preventing the shadow from appearing
        // on incorrect maps. It also sets the shadow's Z-index to 7, placing it just
        // below the airship sprite (z=8) but above the player.
        this._shadowSprite.visible = airship.isOnCurrentMap();
        this._shadowSprite.z = 7;
    }
};

})();
//=============================================================================
//=============================================================================