/*:
 * @target MZ
 * @plugindesc Unified ARPG Extensions Pack v3.0 (Definitive)
 * @author Shinkohyou, Gemini (Assistant)
 * @base ARPG_Core
 * @orderAfter ARPG_Core
 * @orderAfter DotMoveSystem
 * @orderAfter SelfVariable
 * @orderAfter ARPG_WeaponAnimation
 * @orderAfter ARPG_StateCommonEvents
 * @url https://github.com/Shinkohyou/RMMZ_Plug-Ins
 *
 * @help
 * This plugin unifies several extensions of the ARPG system to simplify
 * plugin management. It includes multiple modules with their own settings
 * and commands, accessible from the RPG Maker MZ editor.
 * 
 * IMPORTANT TECHNICAL NOTE:
 * For this module to work, ARPG_Core.js is required to expose
 * the following classes:
 *   - ARPG_Battler
 *   - ARPG_EffectResult
 *   - BattlerDeadComponent
 *   - ARPG_CharacterTempData
 *   - ARPG_Utils
 *
 * --- MODULE: Free Projectile Rotation (ARPG_Core_FreeRotate) ---
 * (v3.3) Free 360° rotation of projectiles with adjustable offset.
 * 1. Assign your event a graphic facing the base direction (e.g., Right).
 * 2. Use the "Activate Projectile Rotation" plugin command.
 * 3. Move the event with a degree-based movement system (e.g., DotMoveSystem).
 *
 * --- MODULE: Extended Functions (ARPG_Core_FunctionEx) ---
 * Adds advanced commands for movement and target searching for AI.
 * - Move by Angle (DotMove): Moves a character in an angular direction.
 * - Move towards Character: Moves a character towards another.
 * - Advanced Battler Search: Searches for enemies/allies with filters.
 *
 * --- MODULE: State Common Events (ARPG_StateCommonEvents) ---
 * Allows executing common events based on states.
 * Use the following notetags in states:
 * <CE: ID> - Executes the common event with that ID periodically.
 * <CE_Interval: FRAMES> - (Optional) Execution frequency for CE.
 * <CEClean: ID> - Executes the common event once when the state is removed.
 *
 * --- MODULE: Dynamic Attributes (ARPG_DynamicTraits) ---
 * Allows modifying regeneration attributes (HRG, MRG, TRG)
 * temporarily during the game using a plugin command.
 *
 * --- MODULE: Real-Time Regeneration (ARPG_RealTimeRegen) ---
 * Makes HRG, MRG, and TRG attributes work in real-time on the map.
 * A character with 5% HRG will recover 5% of their max HP every second.
 *
 * --- MODULE: State Icons (ARPG_StateOverlay) ---
 * Displays state icons above characters' heads.
 * Visual and functional settings (position, animation, who to show on, etc.)
 * are configured in the parameters of this unified plugin.
 * 
 * ---> KEY INSTRUCTION FOR DURATION COUNTER: <---
 * For a state to show its duration in seconds above the icon,
 * add the following tag in the "Notes" of the state in the database:
 *
 *    <duration: 600>
 *
 * The number represents the duration in FRAMES (60 frames = 1 second).
 * 
 * ---> INSTRUCTION TO EXCLUDE ENEMIES: <---
 * To prevent a specific enemy from displaying its state icons,
 * add the following tag in the "Notes" of that enemy in the database:
 *
 *    <NoStateIcons>
 *
 * --- MODULE: Context Awareness (ContextAware) ---
 * Provides tools to work with the event's context.
 * - Global Object `MainEvent`: Always refers to the event executing the command.
 * - Plugin Commands: To filter, check, and search for events based
 *   on conditions, manage timers, and change states.
 *
 * --- MODULE: Compatibility Patch (ARPG_CompatibilityPatch) ---
 * Adds a faction system based on Self Variables and resolves
 * compatibility issues with other plugins.
 * Notetags for Skills:
 * <targetFaction: VAR_ID, VALUE> - The skill ONLY damages this faction.
 * <ignoreFaction: VAR_ID, VALUE> - The skill ignores this faction.
 * 
 * --- CREDITS AND BASIS ---
 * unagi ootoro
 *
 * @command setProjectileRotation
 * @text [Rotation] Activate Projectile Rotation
 * @desc Enables/disables 360° rotation for an event with an offset.
 *
 * @arg characterSpecification
 * @text Character (Event)
 * @type struct<CharacterSpecification>
 * @default {"CharacterKind":"thisEvent"}
 * @arg enable
 * @text Enable Rotation
 * @type boolean
 * @on Yes
 * @off No
 * @default true
 * @arg baseDirection
 * @text Base Sprite Direction
 * @type select
 * @option Down (↓) @value 2
 * @option Left (←) @value 4
 * @option Right (→) @value 6
 * @option Up (↑) @value 8
 * @default 6
 * @arg rotationOffset
 * @text Rotation Offset (degrees)
 * @type number
 * @min -360
 * @max 360
 * @default 0
 * @desc Extra degrees to adjust orientation (positive = clockwise).
 *
 * @command MoveByAngle
 * @text [FuncEx] Move by Angle (DotMove)
 * @desc Moves a character in a specific angular direction using DotMoveSystem.
 *
 * @arg SubjectCharacterSpecification
 * @text Character to Move
 * @type struct<CharacterSpecification>
 * @default {"CharacterKind":"thisEvent","CharacterKindByVariable":"0","EventIdOrName":"1","EventIdByVariable":"0","FollowerIndex":"1","FollowerIndexByVariable":"0","VehicleKind":"boat","VehicleKindByVariable":"0"}
 * @desc The character that will perform the movement.
 * @arg autoCalculateAngle
 * @text Calculate Angle Automatically
 * @type boolean
 * @on Yes (Ignore manual angle)
 * @off No (Use manual angle)
 * @default false
 * @desc If enabled, the character will calculate the angle towards the specified target below.
 * @arg TargetCharacterSpecification
 * @text Target Character (for auto-calculation)
 * @type struct<CharacterSpecification>
 * @default {"CharacterKind":"player","CharacterKindByVariable":"0","EventIdOrName":"1","EventIdByVariable":"0","FollowerIndex":"1","FollowerIndexByVariable":"0","VehicleKind":"boat","VehicleKindByVariable":"0"}
 * @desc The target for angle calculation if the above option is enabled.
 * @arg manualAngle
 * @text Manual Angle
 * @type number
 * @decimals 2
 * @default 0
 * @desc The angle (0-359) at which the character will move if auto-calculation is disabled.
 * @arg manualAngleByVariable
 * @text Manual Angle (from Variable)
 * @type variable
 * @default 0
 * @desc Uses the value of this variable as the angle. Overrides the manual value.
 *
 * @command MoveToCharacter
 * @text [FuncEx] Move Towards Character (Advanced)
 * @desc Moves a character towards another, with an option to use pathfinding.
 *
 * @arg SubjectCharacterSpecification
 * @text Character to Move
 * @type struct<CharacterSpecification>
 * @default {"CharacterKind":"thisEvent"}
 * @desc The character that will be moved.
 *
 * @arg TargetCharacterSpecification
 * @text Target Character
 * @type struct<CharacterSpecification>
 * @default {"CharacterKind":"player"}
 * @desc The character towards which the subject will move.
 *
 * @arg UsePathfinding
 * @text Use Pathfinding
 * @type boolean
 * @on Yes (Ignores obstacles)
 * @off No (Direct movement)
 * @default false
 * @desc If enabled, the character will use A* to find a route. Otherwise, it moves in a straight line.
 *
 * @arg ThinkingTime
 * @text Thinking Time (Pathfinding)
 * @type number
 * @min 0
 * @default 30
 * @desc Only for Pathfinding. Frequency in frames to recalculate the path. 0 = every frame.
 *
 * @command SearchBattlerByHP
 * @text [FuncEx] Search for Battler (Advanced)
 * @desc Searches for a battler applying HP, state, and self-variable filters. The result is sorted by the search method.
 *
 * @arg SearchMethod
 * @text Main Search Method
 * @type select
 * @option Lowest HP % (weakest)
 * @value lowest_hp_percent
 * @option Highest HP % (strongest)
 * @value highest_hp_percent
 * @option Lowest absolute HP
 * @value lowest_hp_value
 * @option Highest absolute HP
 * @value highest_hp_value
 * @option Nearest
 * @value nearest
 * @option Has Specific State (prioritized)
 * @value has_state
 * @option Does NOT Have Specific State (prioritized)
 * @value not_has_state
 * @default lowest_hp_percent
 * @desc The main criterion for sorting and selecting the final target.
 * @arg SubjectCharacterSpecification
 * @text Origin Character
 * @type struct<CharacterSpecification>
 * @default {"CharacterKind":"thisEvent","CharacterKindByVariable":"0","EventIdOrName":"1","EventIdByVariable":"0","FollowerIndex":"1","FollowerIndexByVariable":"0","VehicleKind":"boat","VehicleKindByVariable":"0"}
 * @desc The character from which the search is performed (to calculate distances).
 * @arg thinkingTime
 * @text Thinking Time (Frames)
 * @type number
 * @min 0
 * @default 0
 * @desc If > 0, the command will only run if N frames have passed since the last search attempt for this character.
 * @arg --- Selection Filters ---
 * @desc These conditions are applied BEFORE the search method to create the list of candidates.
 * @arg Target
 * @text Faction Filter
 * @type select
 * @option all battlers
 * @value all
 * @option opponent character
 * @value opponent
 * @option friendly character
 * @value friend
 * @option Opponent OR with Self Variable
 * @value opponent_or_selfvar
 * @option Friend OR with Self Variable
 * @value friend_or_selfvar
 * @option Friend AND with Self Variable
 * @value friend_and_selfvar
 * @option Only with Self Variable
 * @value selfvar_only
 * @default opponent
 * @desc Filters targets by their relationship to the origin character.
 * @arg maxDistance
 * @text Maximum Distance
 * @type number
 * @decimals 2
 * @default 0
 * @desc Maximum distance to consider a target. 0 or a negative value means no limit.
 * @arg selfVariableCriteria
 * @text Self Variable Criteria
 * @type struct<SelfVarCriterion>[]
 * @default []
 * @desc List of Self Variables to check. If a character meets ANY of these, they pass the filter.
 * @arg lifeCondition
 * @text Life Condition
 * @type select
 * @option (None)
 * @value none
 * @option Is Alive
 * @value alive
 * @option Is Dead
 * @value dead
 * @default alive
 * @desc Filters by life status. By default, it only searches among the living.
 * @arg hasStatesCondition
 * @text Condition: HAS States
 * @type state[]
 * @desc The character must have ALL states from this list.
 * @default []
 * @arg notHasStatesCondition
 * @text Condition: DOES NOT HAVE States
 * @type state[]
 * @desc The character must NOT have ANY of the states from this list.
 * @default []
 * @arg searchStateIds
 * @text States for Specific Search
 * @type state[]
 * @desc Used only if "Search Method" is "Has/Not Has State". The character must meet the condition for ANY state in this list.
 * @default []
 * @arg --- Results ---
 * @desc Where to store the information of the found battler.
 * @arg StoreResultSwitchId
 * @text Result Switch
 * @type switch
 * @default 1
 * @desc Turns ON if a target is found that meets all criteria; otherwise, turns OFF.
 * @arg StoreCharacterKindVariableId
 * @text Variable for Character Type
 * @type variable
 * @default 0
 * @desc Stores the type of character found (1: Player, 2: Follower, 3: Event).
 * @arg StoreEventIdVariableId
 * @text Variable for Event ID
 * @type variable
 * @default 0
 * @desc If the target is an event, its ID is stored here.
 *
 * @command modifyRegenTrait
 * @text [Traits] Modify Dynamic Regeneration
 * @desc Adds, modifies, or removes a temporary regeneration effect from a character.
 *
 * @arg character
 * @text Character
 * @type struct<CharacterSpecification>
 * @desc The character that will receive the effect.
 * @arg effectKey
 * @text Effect Key
 * @type string
 * @desc A unique name for this effect (e.g., "StrengthAura", "SpeedPotion").
 * @arg regenType
 * @text Regeneration Type
 * @type select
 * @option HP Regeneration (HRG)
 * @value 7
 * @option MP Regeneration (MRG)
 * @value 8
 * @option TP Regeneration (TRG)
 * @value 9
 * @default 7
 * @desc Choose the type of regeneration to modify.
 * @arg operator
 * @text Operator
 * @type select
 * @option + (Add/Set)
 * @value add
 * @option Remove Effect
 * @value remove
 * @default add
 * @desc Choose whether to add/set the value or remove the effect completely.
 * @arg value
 * @text Value (%)
 * @type number
 * @min -1000
 * @max 1000
 * @default 0
 * @desc The value to apply. It is an adder. For +25%, enter 25. For -5%, enter -5.
 *
 * @command filterThisEvent
 * @text [Context] Filter Current Event (Store ID)
 * @desc Checks if the current event meets conditions and stores its ID in a variable.
 *
 * @arg lifeCondition
 * @text Life Condition
 * @type select
 * @option (None)
 * @value none
 * @option Is Alive
 * @value alive
 * @option Is Dead
 * @value dead
 * @default none
 * @desc Filter based on whether the character is alive or dead.
 * @arg hasStatesCondition
 * @text Condition: HAS States
 * @type state[]
 * @desc The character must have ALL states from this list. Leave empty for no check.
 * @arg notHasStatesCondition
 * @text Condition: DOES NOT HAVE States
 * @type state[]
 * @desc The character must NOT have ANY of the states from this list. Leave empty for no check.
 * @arg resultVariableId
 * @text Result Variable ID
 * @type variable
 * @desc The variable where the event ID will be stored if it passes all filters.
 * @default 0
 * @arg onFail
 * @text If Filter Fails
 * @type select
 * @option Do nothing
 * @value none
 * @option Set Variable to Zero
 * @value reset_to_zero
 * @default reset_to_zero
 * @desc What to do with the result variable if the character does not meet the conditions.
 *
 * @command filterEventById
 * @text [Context] Filter Event by ID (Store in Switch)
 * @desc Checks if an event (specified by the ID in a variable) meets conditions.
 *
 * @arg sourceVariableId
 * @text Variable with Event ID
 * @type variable
 * @desc The variable containing the ID of the event you want to check.
 * @default 0
 * @arg lifeCondition
 * @text Life Condition
 * @type select
 * @option (None)
 * @value none
 * @option Is Alive
 * @value alive
 * @option Is Dead
 * @value dead
 * @default none
 * @desc Filter based on whether the character is alive or dead.
 * @arg hasStatesCondition
 * @text Condition: HAS States
 * @type state[]
 * @desc The character must have ALL states from this list.
 * @arg notHasStatesCondition
 * @text Condition: DOES NOT HAVE States
 * @type state[]
 * @desc The character must NOT have ANY of the states from this list.
 * @arg resultSwitchId
 * @text Result Switch
 * @type switch
 * @desc The switch that will be turned ON if the event meets the conditions, or OFF if it does not.
 * @default 0
 *
 * @command checkThisEvent
 * @text [Context] Check Current Event (Store in Switch)
 * @desc Checks if the current event meets conditions and stores the result in a switch.
 *
 * @arg lifeCondition
 * @text Life Condition
 * @type select
 * @option (None)
 * @value none
 * @option Is Alive
 * @value alive
 * @option Is Dead
 * @value dead
 * @default none
 * @desc Filter based on whether the character is alive or dead.
 * @arg hasStatesCondition
 * @text Condition: HAS States
 * @type state[]
 * @desc The character must have ALL states from this list.
 * @arg notHasStatesCondition
 * @text Condition: DOES NOT HAVE States
 * @type state[]
 * @desc The character must NOT have ANY of the states from this list.
 * @arg resultSwitchId
 * @text Result Switch
 * @type switch
 * @desc The switch that will be turned ON if the event meets the conditions, or OFF if it does not.
 * @default 0
 * 
 * @command findEventBySelfVariable
 * @text [Context] Find Event (Advanced, by Self Variable)
 * @desc Finds the nearest event that meets Self Variable criteria, with performance optimization.
 *
 * @arg criteriaLogic
 * @text Criteria Logic
 * @type select
 * @option Event must meet ANY criterion (OR)
 * @value or
 * @option Event must meet ALL criteria (AND)
 * @value and
 * @default or
 * @desc Defines how multiple Self Variable criteria are evaluated.
 *
 * @arg selfVariableCriteria
 * @text Self Variable Criteria
 * @type struct<SelfVarCriterion>[]
 * @desc List of Self Variable conditions to check on map events.
 * @default []
 *
 * @arg subjectCharacter
 * @text Origin Character (for distance)
 * @type select
 * @option This Event
 * @value thisEvent
 * @option Player
 * @value player
 * @default thisEvent
 * @desc The character from which distance will be measured.
 *
 * @arg maxDistance
 * @text Maximum Distance
 * @type number
 * @decimals 2
 * @default 0
 * @desc Maximum distance to consider a target. 0 or negative means no limit.
 *
 * @arg thinkingTime
 * @text Thinking Time (Frames)
 * @type number
 * @min 0
 * @default 30
 * @desc Frequency to execute the search. 0 = every frame. Use > 0 to optimize performance.
 *
 * @arg resultVariableId
 * @text Variable to Store ID
 * @type variable
 * @desc The variable where the ID of the nearest found event will be stored. If not found, 0 is stored.
 * @default 0
 * 
 * @command manageContextTimer
 * @text [Context] Manage Context Timer
 * @desc Starts, restarts, or checks a timer associated with this event.
 *
 * @arg timerId
 * @text Timer ID
 * @type string
 * @desc A unique name for this timer (e.g., "AttackCooldown", "Regeneration"). Case-sensitive.
 * @arg operation
 * @text Operation
 * @type select
 * @option Start / Restart Timer
 * @value start
 * @default start
 * @desc The action to perform.
 * @arg duration
 * @text Duration
 * @type number
 * @min 1
 * @default 60
 * @desc The duration of the timer.
 * @arg durationUnit
 * @text Duration Unit
 * @type select
 * @option Frames
 * @value frames
 * @option Seconds
 * @value seconds
 * @default frames
 * @arg thinkingTime
 * @text Thinking Time (Cooldown)
 * @type number
 * @min 0
 * @default 0
 * @desc If > 0, the timer CANNOT be restarted until N units of time have passed since it was last started.
 * @arg thinkingTimeUnit
 * @text Cooldown Unit
 * @type select
 * @option Frames
 * @value frames
 * @option Seconds
 * @value seconds
 * @default frames
 * @arg resultSwitchId
 * @text Result Switch (Optional)
 * @type switch
 * @default 0
 * @desc Switch that is set to ON when the timer finishes, and OFF while it is active.
 * @arg resultVariableId
 * @text Result Variable (Optional)
 * @type variable
 * @default 0
 * @desc Variable that will store the remaining frames of the timer.
 * 
 * @command changeState
 * @text [Context] Change Character State
 * @desc Adds or removes a state from a specific character (This Event, Player, etc.).
 *
 * @arg character
 * @text Character
 * @type struct<CharacterSpecification>
 * @desc The character to be affected. Use the options to target the player, followers, or specific events.
 * @default {"CharacterKind":"thisEvent"}
 * @arg operation
 * @text Operation
 * @type select
 * @option Add State
 * @value add
 * @option Remove State
 * @value remove
 * @default add
 * @desc Choose whether you want to add or remove the state.
 * @arg stateId
 * @text State
 * @type state
 * @desc The state you want to add or remove.
 * @default 1
 *
 * @param --- Module: State Icons (State Overlay) ---
 * @desc Settings for the module that displays state icons above characters.
 * @default
 *
 * @param enableStateOverlay
 * @parent --- Module: State Icons (State Overlay) ---
 * @text Enable Module
 * @type boolean
 * @on Enabled
 * @off Disabled
 * @desc Master switch to enable or disable the display of all state icons in the game.
 * @default true
 *
 * @param showOnTargetType
 * @parent --- Module: State Icons (State Overlay) ---
 * @text Show Icons On
 * @type select
 * @option Actors and Enemies
 * @value both
 * @option Actors Only
 * @value actors
 * @option Enemies Only
 * @value enemies
 * @desc Choose on which type of characters the state icons will be displayed.
 * @default both
 *
 * @param yOffset
 * @parent --- Module: State Icons (State Overlay) ---
 * @text Vertical Offset (Y)
 * @type number
 * @min -200
 * @desc Initial position of the icon group above the character's head. A negative value moves them up.
 * @default -52
 *
 * @param layout
 * @parent --- Module: State Icons (State Overlay) ---
 * @text Icon Layout
 * @type select
 * @option Horizontal Row
 * @value horizontal
 * @option Vertical Column
 * @value vertical
 * @option Grid
 * @value grid
 * @desc How icons are organized if a character has more than one active state.
 * @default horizontal
 *
 * @param gridColumns
 * @parent --- Module: State Icons (State Overlay) ---
 * @text Grid Columns
 * @type number
 * @min 1
 * @desc If the layout is "Grid", defines how many icons are displayed per row before creating a new one.
 * @default 4
 *
 * @param iconSpacingX
 * @parent --- Module: State Icons (State Overlay) ---
 * @text Horizontal Spacing (X)
 * @type number
 * @min 0
 * @desc Space in pixels between each icon in a row or grid.
 * @default 34
 *
 * @param iconSpacingY
 * @parent --- Module: State Icons (State Overlay) ---
 * @text Vertical Spacing (Y)
 * @type number
 * @min 0
 * @desc Space in pixels between rows of icons if using the "Grid" layout.
 * @default 34
 *
 * @param animationType
 * @parent --- Module: State Icons (State Overlay) ---
 * @text Animation Type
 * @type select
 * @option None
 * @value none
 * @option Float (Up and Down)
 * @value float
 * @option Scale (Pulse)
 * @value scale
 * @option Rotate (Spin)
 * @value rotate
 * @desc Choose the type of visual animation that the state icons will have.
 * @default float
 *
 * @param animationSpeed
 * @parent --- Module: State Icons (State Overlay) ---
 * @text Animation Speed
 * @type number
 * @decimals 3
 * @desc The speed of the animation. A higher value makes it faster. (Recommended range: 0.01 to 0.1).
 * @default 0.025
 *
 * @param animationRange
 * @parent --- Module: State Icons (State Overlay) ---
 * @text Animation Range
 * @type number
 * @decimals 2
 * @desc The magnitude of the animation effect. For 'Float' it's pixels; for 'Scale' and 'Rotate' it's a multiplier.
 * @default 3
 *
 * @param showDuration
 * @parent --- Module: State Icons (State Overlay) ---
 * @text Show Numeric Duration
 * @type boolean
 * @desc If enabled, it will display a numeric counter with the remaining duration of the state (requires the <duration> tag).
 * @default true
 *
 * @param durationTextSize
 * @parent --- Module: State Icons (State Overlay) ---
 * @text Font Size (Duration)
 * @type number
 * @min 8
 * @desc The font size for the duration counter number.
 * @default 18
 *
 * @param durationTextColor
 * @parent --- Module: State Icons (State Overlay) ---
 * @text Text Color (Duration)
 * @type string
 * @desc The text color of the duration counter. Format: #RRGGBB.
 * @default #FFFFFF
 *
 * @param durationTextOutlineColor
 * @parent --- Module: State Icons (State Overlay) ---
 * @text Outline Color (Duration)
 * @type string
 * @desc The color of the text outline for the counter. Format: rgba(R,G,B,A).
 * @default rgba(0, 0, 0, 0.8)
 */
/*~struct~CharacterSpecification:
 * @param CharacterKind
 * @text Character Kind
 * @type select
 * @option thisEvent @value thisEvent
 * @option player @value player
 * @option follower @value follower
 * @option event @value event
 * @option vehicle @value vehicle
 * @default thisEvent
 * @param CharacterKindByVariable
 * @text Character type (variable specification)
 * @type variable
 * @default 0
 * @param EventIdOrName
 * @text event ID or event name
 * @type string
 * @default 1
 * @param EventIdByVariable
 * @text event ID (variable specification)
 * @type variable
 * @default 0
 * @param FollowerIndex
 * @text follower index
 * @type number
 * @min 1
 * @default 1
 * @param FollowerIndexByVariable
 * @text follower index (specify variable)
 * @type variable
 * @default 0
 * @param VehicleKind
 * @text Vehicle type
 * @type select
 * @option small boat @value boat
 * @option large ship @value ship
 * @option airship @value airship
 * @default boat
 * @param VehicleKindByVariable
 * @text Vehicle type (specify variable)
 * @type variable
 * @default 0
 */
/*~struct~SelfVarCriterion:
 * @param id
 * @text Self Variable ID
 * @type variable
 * @desc The self variable ($) that will be used as a criterion.
 * @default 0
 * @param value
 * @text Value to Compare
 * @type number
 * @desc The value the self variable must have.
 * @default 0
 * @param valueByVariable
 * @text Value (from Global Variable)
 * @type variable
 * @desc Optional. Uses the value of this variable instead of the direct value.
 * @default 0
 */

//=============================================================================
// START OF EXECUTABLE CODE
//=============================================================================
(() => {
    "use strict";

    // --- Unique Plugin Name Definition for all modules ---
    const unifiedPluginName = document.currentScript.src.match(/^.*\/(.+)\.js$/)[1];

    // ============================================================================
    // START: ARPG_Core_FreeRotate.js
    // ============================================================================
    (() => {
        const _Game_Event_initMembers_cfr = Game_Event.prototype.initMembers;
        Game_Event.prototype.initMembers = function() {
            _Game_Event_initMembers_cfr.call(this);
            this._isProjectile = false;
            this._projectileBaseDirection = 6;
            this._projectileOffset = 0;
        };
        class Sprite_Projectile extends Sprite {
            constructor(character) {
                super();
                this._character = character;
                this._lastRealX = character._realX;
                this._lastRealY = character._realY;
                this.anchor.set(0.5, 0.5);
                this.loadBitmap();
            }
            loadBitmap() {
                this.bitmap = ImageManager.loadCharacter(this._character.characterName());
                this.bitmap.addLoadListener(this.setupFrame.bind(this));
            }
            setupFrame() {
                if (!this.bitmap.isReady()) return;
                const pw = this.bitmap.width / (ImageManager.isBigCharacter(this._character.characterName()) ? 3 : 12);
                const ph = this.bitmap.height / (ImageManager.isBigCharacter(this._character.characterName()) ? 4 : 8);
                const sx = (this._character.characterIndex() % 4) * 3 + 1;
                const sy = Math.floor(this._character.characterIndex() / 4) * 4 + {2: 0, 4: 1, 6: 2, 8: 3}[this._character._projectileBaseDirection];
                this.setFrame(sx * pw, sy * ph, pw, ph);
                this.update();
            }
            update() {
                super.update();
                this.updatePosition();
                this.updateRotation();
                this.visible = !this._character.isTransparent() && !this._character._erased;
            }
            updatePosition() {
                this.x = this._character.screenX();
                this.y = this._character.screenY() - Math.round((this._character.height() || 1) * $gameMap.tileHeight() / 2);
                this.z = this._character.screenZ() + 1;
            }
            updateRotation() {
                const char = this._character;
                const dx = char._realX - this._lastRealX;
                const dy = char._realY - this._lastRealY;
                if (Math.abs(dx) > 1e-6 || Math.abs(dy) > 1e-6) {
                    const angleRad = Math.atan2(dy, dx);
                    const baseOffsets = {2: Math.PI/2, 4: Math.PI, 6: 0, 8: -Math.PI/2};
                    const offsetRad = (char._projectileOffset || 0) * Math.PI / 180;
                    this.rotation = angleRad - (baseOffsets[char._projectileBaseDirection] || 0) + offsetRad;
                }
                this._lastRealX = char._realX;
                this._lastRealY = char._realY;
            }
        }
        const _Spriteset_Map_createCharacters_cfr = Spriteset_Map.prototype.createCharacters;
        Spriteset_Map.prototype.createCharacters = function() {
            this._projectileSprites = [];
            _Spriteset_Map_createCharacters_cfr.call(this);
        };
        const _Spriteset_Map_update_cfr = Spriteset_Map.prototype.update;
        Spriteset_Map.prototype.update = function() {
            _Spriteset_Map_update_cfr.call(this);
            this.updateProjectiles();
        };
        Spriteset_Map.prototype.updateProjectiles = function() {
            for (const sprite of this._characterSprites) {
                const char = sprite.character();
                const idx = this._projectileSprites.findIndex(p => p._character === char);
                if (char instanceof Game_Event && char._isProjectile) {
                    sprite.visible = false;
                    if (idx < 0) {
                        const ps = new Sprite_Projectile(char);
                        this._projectileSprites.push(ps);
                        this._tilemap.addChild(ps);
                    }
                } else if (idx >= 0) {
                    this._tilemap.removeChild(this._projectileSprites[idx]);
                    this._projectileSprites[idx].destroy();
                    this._projectileSprites.splice(idx, 1);
                    sprite.visible = true;
                }
            }
        };
        PluginManager.registerCommand(unifiedPluginName, "setProjectileRotation", function(args) {
            if (!this.findCharacterBySpecification) {
                console.error("ARPG_Core_FreeRotate: findCharacterBySpecification is missing");
                return;
            }
            const spec = JSON.parse(args.characterSpecification);
            const ch = this.findCharacterBySpecification(spec);
            if (ch && ch instanceof Game_Event) {
                ch._isProjectile = args.enable === "true";
                if (ch._isProjectile) {
                    ch._projectileBaseDirection = Number(args.baseDirection) || 6;
                    ch._projectileOffset = Number(args.rotationOffset) || 0;
                    ch.setDirectionFix(true);
                } else {
                    ch.setDirectionFix(false);
                }
            }
        });
    })();
    // ============================================================================
    // END: ARPG_Core_FreeRotate.js
    // ============================================================================


    // ============================================================================
    // START: ARPG_Core_FunctionEx.js
    // ============================================================================
    (() => {
        class PluginParamsParser {
            static parse(params, typeData = {}, predictEnable = true) { return new PluginParamsParser(predictEnable).parse(params, typeData); }
            constructor(predictEnable = true) { this._predictEnable = predictEnable; }
            parse(params, typeData = {}) {
                const result = {};
                for (const name in params) { result[name] = this.convertParam(this.expandParam(params[name]), typeData[name]); }
                return result;
            }
            expandParam(strParam, loopCount = 0) {
                if (++loopCount > 255) throw new Error("endless loop error");
                if (strParam.match(/^\s*\[.*\]\s*$/)) {
                    return JSON.parse(strParam).map((data) => this.expandParam(data, loopCount + 1));
                } else if (strParam.match(/^\s*\{.*\}\s*$/)) {
                    const result = {};
                    const objParam = JSON.parse(strParam);
                    for (const name in objParam) { result[name] = this.expandParam(objParam[name], loopCount + 1); }
                    return result;
                }
                return strParam;
            }
            convertParam(param, type, loopCount = 0) {
                if (++loopCount > 255) throw new Error("endless loop error");
                if (typeof param === "string") { return this.cast(param, type); }
                if (typeof param === "object" && param instanceof Array) {
                    return param.map((data, i) => this.convertParam(data, type?.[i], loopCount + 1));
                }
                if (typeof param === "object") {
                    const result = {};
                    for (const name in param) { result[name] = this.convertParam(param[name], type?.[name], loopCount + 1); }
                    return result;
                }
                throw new Error(`Invalid param: ${param}`);
            }
            cast(param, type) {
                if (param == null || param === "") return undefined;
                if (type == null) type = "any";
                switch (type) {
                    case "any": if (!this._predictEnable) throw new Error("Predict mode is disable"); return this.cast(param, this.predict(param));
                    case "string": return param;
                    case "number": return param.match(/^\-?\d+\.\d+$/) ? parseFloat(param) : parseInt(param, 10);
                    case "boolean": return param === "true";
                    default: throw new Error(`Unknown type: ${type}`);
                }
            }
            predict(param) {
                if (param.match(/^\-?\d+$/) || param.match(/^\-?\d+\.\d+$/)) { return "number"; }
                if (param === "true" || param === "false") { return "boolean"; }
                return "string";
            }
        };
        if (typeof ARPG_CharacterTempData !== 'undefined') {
            const _ARPG_CharacterTempData_initialize_fe = ARPG_CharacterTempData.prototype.initialize;
            ARPG_CharacterTempData.prototype.initialize = function() {
                _ARPG_CharacterTempData_initialize_fe.call(this);
                this.lastSearchFrame = 0;
                this.lastPathfindFrame = 0;
                this.pathfindingDirection = 0;
            };
        }
        if (typeof ARPG_Utils !== 'undefined') {
            ARPG_Utils.filterBattlers = function(subjectCharacter, filters) {
                if (!subjectCharacter.isBattler()) throw new Error(`Subject character is not battler.`);
                let initialList = (filters.lifeCondition === 'dead') ? this.allBattlerCharacters() : this.allAliveBattlerCharacters();
                const isOpponent = (t) => subjectCharacter.battler().isActor() ? t.battler().isEnemy() : (subjectCharacter.battler().isEnemy() ? t.battler().isActor() : false);
                const isFriend = (t) => subjectCharacter.battler().isActor() ? t.battler().isActor() : (subjectCharacter.battler().isEnemy() ? t.battler().isEnemy() : false);
                const hasCorrectSelfVar = (t) => {
                    if (!filters.selfVarCriteria || filters.selfVarCriteria.length === 0 || !(t instanceof Game_Event)) return false;
                    return filters.selfVarCriteria.some(c => $gameVariables.selfVariableValue([t._mapId, t.eventId(), c.id]) === c.value);
                };
                const checkLife = (t) => {
                    if (filters.lifeCondition === 'none') return true;
                    const isAlive = t.battler().isAlive();
                    return (filters.lifeCondition === 'alive') ? isAlive : !isAlive;
                };
                const checkHasStates = (t) => !filters.hasStates || filters.hasStates.length === 0 || filters.hasStates.every(id => t.battler().battler().isStateAffected(id));
                const checkNotHasStates = (t) => !filters.notHasStates || filters.notHasStates.length === 0 || !filters.notHasStates.some(id => t.battler().battler().isStateAffected(id));
                const checkMaxDist = (t) => filters.maxDistance <= 0 || subjectCharacter.calcFar(t) <= filters.maxDistance;
                return initialList.filter(target => {
                    if (target === subjectCharacter || !checkLife(target) || !checkMaxDist(target) || !checkHasStates(target) || !checkNotHasStates(target)) return false;
                    switch (filters.targetType) {
                        case "all": return true;
                        case "opponent": return isOpponent(target);
                        case "friend": return isFriend(target);
                        case "opponent_or_selfvar": return isOpponent(target) || hasCorrectSelfVar(target);
                        case "friend_or_selfvar": return isFriend(target) || hasCorrectSelfVar(target);
                        case "friend_and_selfvar": return isFriend(target) && hasCorrectSelfVar(target);
                        case "selfvar_only": return hasCorrectSelfVar(target);
                        default: return false;
                    }
                });
            };
            ARPG_Utils.searchBattlerByHP = function(subjectCharacter, filters, searchParams) {
                let candidates = this.filterBattlers(subjectCharacter, filters);
                if (candidates.length === 0) return { character: null };
                if ((searchParams.method === 'has_state' || searchParams.method === 'not_has_state') && searchParams.stateIds?.length > 0) {
                    const hasState = c => searchParams.stateIds.some(id => c.battler().battler().isStateAffected(id));
                    const condition = searchParams.method === 'has_state' ? hasState : c => !hasState(c);
                    const prioritized = candidates.filter(condition);
                    if (prioritized.length > 0) candidates = prioritized;
                    candidates.sort((a, b) => subjectCharacter.calcFar(a) - subjectCharacter.calcFar(b));
                } else {
                    candidates.sort((a, b) => {
                        const battlerA = a.battler().battler();
                        const battlerB = b.battler().battler();
                        let aValue, bValue;
                        switch (searchParams.method) {
                            case 'lowest_hp_percent': aValue = battlerA.hpRate(); bValue = battlerB.hpRate(); break;
                            case 'highest_hp_percent': aValue = battlerB.hpRate(); bValue = battlerA.hpRate(); break;
                            case 'lowest_hp_value': aValue = battlerA.hp; bValue = battlerB.hp; break;
                            case 'highest_hp_value': aValue = battlerB.hp; bValue = battlerA.hp; break;
                            case 'nearest': return subjectCharacter.calcFar(a) - subjectCharacter.calcFar(b);
                            default: return 0;
                        }
                        return (aValue !== bValue) ? aValue - bValue : subjectCharacter.calcFar(a) - subjectCharacter.calcFar(b);
                    });
                }
                return { character: candidates[0] || null };
            };
        }
        PluginManager.registerCommand(unifiedPluginName, "MoveByAngle", function(args) {
            const params = PluginParamsParser.parse(args);
            const subject = this.findCharacterBySpecification(params.SubjectCharacterSpecification);
            if (!subject) return;
            let angle = 0;
            if (params.autoCalculateAngle) {
                const target = this.findCharacterBySpecification(params.TargetCharacterSpecification);
                if (target) angle = subject.calcDeg(target);
            } else {
                angle = params.manualAngleByVariable > 0 ? $gameVariables.value(params.manualAngleByVariable) : params.manualAngle;
            }
            if (subject.dotMoveByDeg) subject.dotMoveByDeg(angle);
            else console.warn("ARPG_Core_Ex: dotMoveByDeg is not available. Is DotMoveSystem.js active?");
        });
PluginManager.registerCommand(unifiedPluginName, "MoveToCharacter", function(args) {
    const params = PluginParamsParser.parse(args);
    const subject = this.findCharacterBySpecification(params.SubjectCharacterSpecification);
    const target = this.findCharacterBySpecification(params.TargetCharacterSpecification);

    if (!subject || !target) {
        if (!subject) console.warn("ARPG_Core_Ex/MoveToCharacter: The character to be moved is invalid.");
        if (!target) console.warn("ARPG_Core_Ex/MoveToCharacter: The target character is invalid.");
        return;
    }

    // --- Case 1: Direct Movement (no pathfinding) ---
    if (!params.UsePathfinding) {
        subject.moveToTarget(target._realX, target._realY);
        return;
    }

    // --- Case 2: Movement with Pathfinding, Thinking Time, and Staggering ---
    const thinkingTime = Number(params.ThinkingTime) || 0;
    
    // Retrieve the last known direction for this character.
    let direction = subject.arpgTempData().pathfindingDirection || 0;

    // DECISION: Is it time to recalculate the path?
    let isTimeToThink = (thinkingTime === 0); // If time is 0, always think.

    if (thinkingTime > 0) {
        // Check if the character is an event to use its ID for staggering.
        if (subject instanceof Game_Event) {
            // Staggering Logic: Use the event ID to create a unique offset.
            // Each event will "think" on a different frame within the "thinkingTime" cycle.
            const offset = subject.eventId() % thinkingTime;
            if ((Graphics.frameCount + offset) % thinkingTime === 0) {
                isTimeToThink = true;
            }
        } else {
            // Simple Timer Logic (for player/followers or as a fallback).
            const lastPathfind = subject.arpgTempData().lastPathfindFrame || 0;
            if (Graphics.frameCount - lastPathfind >= thinkingTime) {
                isTimeToThink = true;
            }
        }
    }

    if (isTimeToThink) {
        // Execute the pathfinding search (expensive).
        const newDirection = subject.findDirectionTo(target.x, target.y);
        
        // Store the new direction for future frames.
        subject.arpgTempData().pathfindingDirection = newDirection;
        direction = newDirection; // Use this new direction immediately.
        
        // Update the timer (only for the non-event case).
        if (!(subject instanceof Game_Event)) {
            subject.arpgTempData().lastPathfindFrame = Graphics.frameCount;
        }
    }

    // ACTION: Move the character in the current direction (either the new or the stored one).
    // The !subject.isMoving() condition prevents giving a new move command
    // while the character is still completing the previous tile's movement.
    if (direction > 0 && !subject.isMoving()) {
        subject.moveByDirection(direction);
    }
});
    PluginManager.registerCommand(unifiedPluginName, "SearchBattlerByHP", function(args) {
        if (typeof ARPG_Utils === 'undefined') {
            console.error("ARPG_Core_FunctionEx.js requires ARPG_Core.js to expose ARPG_Utils.");
            return;
        }
        const params = PluginParamsParser.parse(args);
        const character = this.findCharacterBySpecification(params.SubjectCharacterSpecification);
        if (!character) return;

        const thinkingTime = Number(params.thinkingTime) || 0;
        let isTimeToThink = (thinkingTime === 0);

        if (thinkingTime > 0) {
            if (character instanceof Game_Event) {
                const offset = character.eventId() % thinkingTime;
                if ((Graphics.frameCount + offset) % thinkingTime === 0) {
                    isTimeToThink = true;
                }
            } else {
                const lastSearch = character.arpgTempData().lastSearchFrame || 0;
                if (Graphics.frameCount - lastSearch >= thinkingTime) {
                    isTimeToThink = true;
                    character.arpgTempData().lastSearchFrame = Graphics.frameCount;
                }
            }
        }

        if (!isTimeToThink) {
            return;
        }
        
        const selfVarCriteria = (params.selfVariableCriteria ? JSON.parse(params.selfVariableCriteria) : []).map(c => ({
            id: Number(c.id),
            value: Number(c.valueByVariable) > 0 ? $gameVariables.value(Number(c.valueByVariable)) : Number(c.value)
        }));
        const filters = {
            targetType: params.Target,
            lifeCondition: params.lifeCondition || 'alive',
            maxDistance: Number(params.maxDistance) || 0,
            hasStates: params.hasStatesCondition ? JSON.parse(params.hasStatesCondition).map(Number) : [],
            notHasStates: params.notHasStatesCondition ? JSON.parse(params.notHasStatesCondition).map(Number) : [],
            selfVarCriteria: selfVarCriteria
        };
        
        const searchParams = { method: params.SearchMethod, stateIds: params.searchStateIds ? JSON.parse(params.searchStateIds).map(Number) : [] };
        
        const { character: foundCharacter } = ARPG_Utils.searchBattlerByHP(character, filters, searchParams);
        
        const success = !!foundCharacter;
        if (params.StoreResultSwitchId > 0) $gameSwitches.setValue(params.StoreResultSwitchId, success);
        if (params.StoreCharacterKindVariableId > 0) $gameVariables.setValue(params.StoreCharacterKindVariableId, success ? ARPG_Utils.characterKindValue(foundCharacter) : 0);
        if (params.StoreEventIdVariableId > 0) $gameVariables.setValue(params.StoreEventIdVariableId, (success && foundCharacter instanceof Game_Event) ? foundCharacter.eventId() : 0);
    });

})();
    // ============================================================================
    // END: ARPG_Core_FunctionEx.js
    // ============================================================================


    // ============================================================================
    // START: ARPG_StateCommonEvents.js
    // ============================================================================
    (() => {
        class StateCommonEventRunner {
            constructor(character, stateId) {
                this._character = character;
                this._stateId = stateId;
                this._stateData = $dataStates[stateId];
                this._commonEventId = Number(this._stateData.meta.CE) || 0;
                this._interval = Number(this._stateData.meta.CE_Interval) || 1;
                this._timer = 0;
                this._interpreter = new Game_Interpreter();
            }
            isActive() { return this._character.isBattler() && this._character.battler().battler().isStateAffected(this._stateId); }
            update() {
                if ($gameMap.isEventRunning()) {
                    if (this._interpreter.isRunning()) this._interpreter.terminate();
                    return;
                }
                if (this._commonEventId > 0) {
                    this._timer--;
                    if (this._timer <= 0) {
                        this._timer = this._interval;
                        if (this._interpreter.isRunning()) this._interpreter.terminate();
                        const commonEventData = $dataCommonEvents[this._commonEventId];
                        if (commonEventData) {
                            const eventId = this._character instanceof Game_Event ? this._character.eventId() : 0;
                            this._interpreter.setup(commonEventData.list, eventId);
                        }
                    }
                }
                if (this._interpreter.isRunning()) this._interpreter.update();
            }
            onStateRemoved() {
                const cleanCommonEventId = Number(this._stateData.meta.CEClean) || 0;
                if (cleanCommonEventId > 0) {
                    const eventId = this._character instanceof Game_Event ? this._character.eventId() : 0;
                    const commonEvent = $dataCommonEvents[cleanCommonEventId];
                    if ($gameMap._interpreter.isRunning()) {
                        $gameMap._interpreter.setupChild(commonEvent.list, eventId);
                    } else {
                        $gameMap._interpreter.setup(commonEvent.list, eventId);
                    }
                }
            }
        }
        const _Game_Character_initMembers_sce = Game_Character.prototype.initMembers;
        Game_Character.prototype.initMembers = function() {
            _Game_Character_initMembers_sce.call(this);
            this._stateCommonEventRunners = {};
        };
        const _Game_Character_update_sce = Game_Character.prototype.update;
        Game_Character.prototype.update = function() {
            _Game_Character_update_sce.call(this);
            this.updateStateCommonEvents();
        };
        Game_Character.prototype.updateStateCommonEvents = function() {
            if (!this.isBattler() || !$gameMap.isEnabledARPGMode()) {
                if (Object.keys(this._stateCommonEventRunners).length > 0) this._stateCommonEventRunners = {};
                return;
            }
            const battler = this.battler().battler();
            const activeStateIds = new Set(battler.states().map(s => s.id));
            for (const stateId of activeStateIds) {
                if (!this._stateCommonEventRunners[stateId] && ($dataStates[stateId].meta.CE || $dataStates[stateId].meta.CEClean)) {
                    this._stateCommonEventRunners[stateId] = new StateCommonEventRunner(this, stateId);
                }
            }
            for (const stateId in this._stateCommonEventRunners) {
                const runner = this._stateCommonEventRunners[stateId];
                if (runner.isActive()) {
                    runner.update();
                } else {
                    runner.onStateRemoved();
                    delete this._stateCommonEventRunners[stateId];
                }
            }
        };
    })();
    // ============================================================================
    // END: ARPG_StateCommonEvents.js
    // ============================================================================


    // ============================================================================
    // START: ARPG_DynamicTraits.js
    // ============================================================================
    (() => {
        function findCharacter_DT(interpreter, specString) {
            const spec = JSON.parse(specString);
            if (!interpreter.findCharacterBySpecification) {
                console.error("ARPG_DynamicTraits requires ARPG_Core.js to function.");
                return null;
            }
            return interpreter.findCharacterBySpecification(spec);
        }
        PluginManager.registerCommand(unifiedPluginName, "modifyRegenTrait", function(args) {
            const character = findCharacter_DT(this, args.character);
            if (!character || !character.isBattler()) return;
            const effectKey = args.effectKey;
            if (args.operator === 'remove') {
                character.battler().battler().removeDynamicTrait(effectKey);
                return;
            }
            const trait = { code: Game_BattlerBase.TRAIT_XPARAM, dataId: Number(args.regenType), value: Number(args.value) / 100.0 };
            character.battler().battler().addDynamicTrait(effectKey, trait);
        });
        const _Game_Battler_initMembers_dt = Game_Battler.prototype.initMembers;
        Game_Battler.prototype.initMembers = function() {
            _Game_Battler_initMembers_dt.call(this);
            this.clearDynamicTraits();
        };
        Game_Battler.prototype.clearDynamicTraits = function() { this._dynamicTraits = {}; };
        Game_Battler.prototype.addDynamicTrait = function(key, trait) {
            if (!this._dynamicTraits) this.clearDynamicTraits();
            this._dynamicTraits[key] = trait;
            this.refresh();
        };
        Game_Battler.prototype.removeDynamicTrait = function(key) {
            if (this._dynamicTraits?.[key]) {
                delete this._dynamicTraits[key];
                this.refresh();
            }
        };
        const _Game_Battler_allTraits_dt = Game_Battler.prototype.allTraits;
        Game_Battler.prototype.allTraits = function() {
            let traits = _Game_Battler_allTraits_dt.call(this);
            if (this._dynamicTraits) traits = traits.concat(Object.values(this._dynamicTraits));
            return traits;
        };
    })();
    // ============================================================================
    // END: ARPG_DynamicTraits.js
    // ============================================================================


    // ============================================================================
    // START: ARPG_RealTimeRegen.js
    // ============================================================================
    (() => {
        const _Game_Battler_regenerateAll_rtr = Game_Battler.prototype.regenerateAll;
        Game_Battler.prototype.regenerateAll = function() {
            if ($gameMap?.isEnabledARPGMode()) return;
            _Game_Battler_regenerateAll_rtr.call(this);
        };
        class RealTimeRegenManager {
            constructor(character) {
                this._character = character;
                this._timer = 60;
            }
            update() {
                if (!this._character.isBattler() || this._character.battler().isDead() || $gameMap.isEventRunning()) return;
                this._timer--;
                if (this._timer <= 0) {
                    this._timer = 60;
                    this.executeRegeneration();
                }
            }
            executeRegeneration() {
                if (typeof ARPG_EffectResult === 'undefined') {
                    console.error("ARPG_RealTimeRegen.js requires ARPG_Core.js to expose ARPG_EffectResult.");
                    return;
                }
                const battler = this._character.battler().battler();
                const hrg = battler.hrg;
                if (hrg !== 0) {
                    const amount = Math.floor(battler.mhp * hrg);
                    if (amount !== 0) {
                        battler.gainHp(amount);
                        $gameTemp.requestFieldDamagePopup(this._character, battler.result());
                        if (amount < 0 && battler.isDead()) {
                            const pseudoResult = new ARPG_EffectResult(battler.result(), null, "NO_GUARD");
                            const deadComponent = this._character.battler().makeRecvDamageComponent(pseudoResult);
                            if (deadComponent) this._character.battler().addComponent(deadComponent);
                        }
                    }
                }
                const mrg = battler.mrg;
                if (mrg !== 0) {
                    const amount = Math.floor(battler.mmp * mrg);
                    if (amount !== 0) battler.gainMp(amount);
                }
                const trg = battler.trg;
                if (trg !== 0) {
                    const amount = Math.floor(100 * trg);
                    if (amount !== 0) battler.gainTp(amount);
                }
            }
        }
        const _Game_Character_initMembers_rtr = Game_Character.prototype.initMembers;
        Game_Character.prototype.initMembers = function() {
            _Game_Character_initMembers_rtr.call(this);
            this._realTimeRegenManager = new RealTimeRegenManager(this);
        };
        const _Game_Character_update_rtr = Game_Character.prototype.update;
        Game_Character.prototype.update = function() {
            _Game_Character_update_rtr.call(this);
            if ($gameMap.isEnabledARPGMode() && this._realTimeRegenManager) {
                this._realTimeRegenManager.update();
            }
        };
    })();
    // ============================================================================
    // END: ARPG_RealTimeRegen.js
    // ============================================================================


// ============================================================================
// START: ARPG_StateOverlay.js (Version with duration manager and filters)
// ============================================================================
(() => {
    'use strict';
    const unifiedPluginName = document.currentScript.src.match(/^.*\/(.+)\.js$/)[1];
    const params = PluginManager.parameters(unifiedPluginName);
    
    // --- NEW CONTROL PARAMETERS ---
    const pEnableOverlay = params['enableStateOverlay'] === 'true';
    const pShowOnTargetType = params['showOnTargetType'] || 'both';

    const pYOffset = Number(params['yOffset'] || -52);
    const pLayout = String(params['layout'] || 'horizontal');
    const pGridColumns = Number(params['gridColumns'] || 4);
    const pIconSpacingX = Number(params['iconSpacingX'] || 34);
    const pIconSpacingY = Number(params['iconSpacingY'] || 34);
    const pAnimationType = String(params['animationType'] || 'float');
    const pAnimationSpeed = Number(params['animationSpeed'] || 0.025);
    const pAnimationRange = Number(params['animationRange'] || 3);
    const pShowDuration = params['showDuration'] === 'true';
    const pDurationTextSize = Number(params['durationTextSize'] || 18);
    const pDurationTextColor = String(params['durationTextColor'] || '#FFFFFF');
    const pDurationTextOutlineColor = String(params['durationTextOutlineColor'] || 'rgba(0, 0, 0, 0.8)');

    // --- DURATION MANAGEMENT SYSTEM ---
    const _Game_Battler_initMembers_duration = Game_Battler.prototype.initMembers;
    Game_Battler.prototype.initMembers = function() {
        _Game_Battler_initMembers_duration.call(this);
        this._statesDuration = {};
    };

    const _Game_Battler_addState = Game_Battler.prototype.addState;
    Game_Battler.prototype.addState = function(stateId) {
        const alreadyAffected = this.isStateAffected(stateId);
        _Game_Battler_addState.call(this, stateId);
        if (this.isStateAffected(stateId) && !alreadyAffected) {
            const state = $dataStates[stateId];
            if (state.meta.duration) {
                this._statesDuration[stateId] = Number(state.meta.duration);
            }
        }
    };

    const _Game_Battler_removeState = Game_Battler.prototype.removeState;
    Game_Battler.prototype.removeState = function(stateId) {
        const wasAffected = this.isStateAffected(stateId);
        _Game_Battler_removeState.call(this, stateId);
        if (wasAffected && !this.isStateAffected(stateId)) {
            delete this._statesDuration[stateId];
        }
    };
    
    const _Game_Battler_update = Game_Battler.prototype.update;
    Game_Battler.prototype.update = function() {
        _Game_Battler_update.call(this);
        this.updateStateDurations();
    };

    Game_Battler.prototype.updateStateDurations = function() {
        for (const stateId in this._statesDuration) {
            if (this.isStateAffected(stateId)) {
                if (this._statesDuration[stateId] > 0) {
                    this._statesDuration[stateId]--;
                }
            } else {
                delete this._statesDuration[stateId];
            }
        }
    };

    // --- Sprite_StateOverlay CLASS (no changes to its internal logic) ---
    class Sprite_StateOverlay extends Sprite {
        constructor() {
            super();
            this.initMembers();
            this.createIconSprite();
            if (pShowDuration) this.createDurationTextSprite();
        }
        initMembers() {
            this.anchor.set(0.5, 0.5);
            this._battler = null;
            this._stateId = 0;
            this._animationCounter = Math.random() * Math.PI * 2;
            this._baseY = 0;
            this._animationY = 0;
        }
        createIconSprite() {
            this._iconSprite = new Sprite_StateIcon();
            this.addChild(this._iconSprite);
        }
        createDurationTextSprite() {
            this._durationTextSprite = new Sprite();
            this._durationTextSprite.bitmap = new Bitmap(ImageManager.iconWidth, ImageManager.iconHeight);
            Object.assign(this._durationTextSprite.bitmap, { fontSize: pDurationTextSize, textColor: pDurationTextColor, outlineColor: pDurationTextOutlineColor });
            this._durationTextSprite.anchor.set(0.5, 0.5);
            this.addChild(this._durationTextSprite);
        }
        setup(battler, stateId) {
            this._battler = battler;
            this._stateId = stateId;
            this._iconSprite.setIconIndex($dataStates[stateId].iconIndex);
        }
        update() {
            super.update();
            if (pShowDuration) this.updateDurationText();
            this.updateAnimation();
            this.y = this._baseY + this._animationY;
        }
        updateDurationText() {
            if (!this._battler || typeof this._battler._statesDuration[this._stateId] === 'undefined') {
                if (this._durationTextSprite) this._durationTextSprite.bitmap.clear();
                return;
            };
            const durationInSeconds = Math.ceil(this._battler._statesDuration[this._stateId] / 60);
            if (this._lastDuration !== durationInSeconds) {
                this._lastDuration = durationInSeconds;
                const text = durationInSeconds > 0 ? String(durationInSeconds) : "";
                if (this._durationTextSprite) {
                    this._durationTextSprite.bitmap.clear();
                    this._durationTextSprite.bitmap.drawText(text, 0, 0, ImageManager.iconWidth, ImageManager.iconHeight, 'center');
                }
            }
        }
        updateAnimation() {
            this._animationCounter = (this._animationCounter + pAnimationSpeed) % (Math.PI * 2);
            switch (pAnimationType) {
                case 'float': this._animationY = Math.sin(this._animationCounter) * pAnimationRange; break;
                case 'scale': const scale = 1.0 + Math.sin(this._animationCounter) * (pAnimationRange / 100); this.scale.set(scale, scale); this._animationY = 0; break;
                case 'rotate': this.rotation = Math.sin(this._animationCounter) * (pAnimationRange / 100); this._animationY = 0; break;
                default: this._animationY = 0;
            }
        }
        stateId() { return this._stateId; }
        setBasePosition(x, y) { this.x = x; this._baseY = y; }
    }
    if (typeof Sprite_StateIcon !== 'undefined') {
        Sprite_StateIcon.prototype.setIconIndex = function(iconIndex) { this._iconIndex = iconIndex; this.updateFrame(); };
        Sprite_StateIcon.prototype.update = function() { Sprite.prototype.update.call(this); };
    }
    
    // --- SPRITE MANAGEMENT AND FILTERING LOGIC ---
    const _Sprite_Character_initMembers_so = Sprite_Character.prototype.initMembers;
    Sprite_Character.prototype.initMembers = function() {
        _Sprite_Character_initMembers_so.call(this);
        this._stateOverlaySprites = [];
    };

    const _Sprite_Character_update_so = Sprite_Character.prototype.update;
    Sprite_Character.prototype.update = function() {
        _Sprite_Character_update_so.call(this);
        this.checkAndSyncStateOverlay();
    };

    // --- KEY FUNCTION MODIFIED WITH NEW FILTERING LOGIC ---
    Sprite_Character.prototype.checkAndSyncStateOverlay = function() {
        // Guard #1: Master switch check.
        if (!pEnableOverlay) {
            if (this._stateOverlaySprites.length > 0) this.removeStateOverlaySprites();
            return;
        }

        const shouldDisplay = this.shouldDisplayStateIcons();
        if (shouldDisplay) {
            const battler = this._character.battler().battler();
            const activeStates = battler.states().filter(state => state.iconIndex > 0);
            const currentStateIds = activeStates.map(s => s.id);
            const lastStateIds = this._stateOverlaySprites.map(s => s.stateId());

            if (currentStateIds.length !== lastStateIds.length || currentStateIds.some((id, i) => id !== lastStateIds[i])) {
                this.syncStateSprites(battler, activeStates);
            }
            
            if (this._stateOverlaySprites.length > 0) {
                this.updateStateOverlayPositions();
            }
        } else {
            if (this._stateOverlaySprites.length > 0) this.removeStateOverlaySprites();
        }
    };

    // --- NEW HELPER FUNCTION FOR CHECKS ---
    Sprite_Character.prototype.shouldDisplayStateIcons = function() {
        // Guard #2: The character must be a valid battler.
        if (!this._character?.isBattler?.()) {
            return false;
        }

        const battler = this._character.battler().battler();

        // Guard #3: Individual exclusion via notetag on enemies.
        if (battler instanceof Game_Enemy && battler.enemy().meta.NoStateIcons) {
            return false;
        }

        // Guard #4: Filter by battler type (actor/enemy).
        if (pShowOnTargetType === 'actors' && !(battler instanceof Game_Actor)) {
            return false;
        }
        if (pShowOnTargetType === 'enemies' && !(battler instanceof Game_Enemy)) {
            return false;
        }

        // If all guards are passed, icons should be displayed.
        return true;
    };

    const _Sprite_Character_updateVisibility_so = Sprite_Character.prototype.updateVisibility;
    Sprite_Character.prototype.updateVisibility = function() {
        _Sprite_Character_updateVisibility_so.call(this);
        if (this._stateOverlaySprites) this._stateOverlaySprites.forEach(s => s.visible = this.visible);
    };
    Sprite_Character.prototype.syncStateSprites = function(battler, activeStates) {
        this.removeStateOverlaySprites();
        for (const state of activeStates) {
            const sprite = new Sprite_StateOverlay();
            sprite.setup(battler, state.id);
            this._stateOverlaySprites.push(sprite);
            this.addChild(sprite);
        }
    };
    Sprite_Character.prototype.removeStateOverlaySprites = function() {
        this._stateOverlaySprites.forEach(sprite => this.removeChild(sprite));
        this._stateOverlaySprites = [];
    };
    Sprite_Character.prototype.updateStateOverlayPositions = function() {
        const sprites = this._stateOverlaySprites;
        if (sprites.length === 0) return;
        const numIcons = sprites.length;
        const cols = (pLayout === 'grid') ? pGridColumns : (pLayout === 'vertical' ? 1 : numIcons);
        const totalWidth = Math.min(numIcons, cols) * pIconSpacingX - (numIcons > 0 ? (pIconSpacingX - ImageManager.iconWidth) : 0);
        const startX = -(totalWidth - ImageManager.iconWidth) / 2;
        sprites.forEach((sprite, i) => {
            const col = i % cols;
            const row = Math.floor(i / cols);
            sprite.setBasePosition(startX + col * pIconSpacingX, pYOffset - this.height + row * pIconSpacingY);
        });
    };
    if (!Game_Character.prototype.isBattler) {
        Game_Character.prototype.isBattler = function() { return false; };
    }
})();
// ============================================================================
// END: ARPG_StateOverlay.js
// ============================================================================


    // ============================================================================
    // START: ContextAware.js
    // ============================================================================
    (() => {
        const MainEventProxy = {
            get event() {
                if (typeof globalActiveInterpreter !== 'undefined' && globalActiveInterpreter) {
                    const eventId = globalActiveInterpreter.eventId();
                    return eventId > 0 ? $gameMap.event(eventId) : null;
                }
                if (SceneManager._scene?._interpreter) {
                     const eventId = SceneManager._scene._interpreter.eventId();
                     return eventId > 0 ? $gameMap.event(eventId) : null;
                }
                return null;
            }
        };
        Object.defineProperty(window, 'MainEvent', { get: () => MainEventProxy.event, configurable: true });
        (() => { // IIFE for setupInterpreterHook_CA
            if (typeof SelfVariable !== 'undefined' || Game_Interpreter.prototype.hasOwnProperty('_update_context_aware_hook')) return;
            Game_Interpreter.prototype._update_context_aware_hook = true;
            const _Game_Interpreter_update = Game_Interpreter.prototype.update;
            Game_Interpreter.prototype.update = function() {
                window.globalActiveInterpreter = this;
                _Game_Interpreter_update.call(this);
                window.globalActiveInterpreter = null;
            };
        })();
        function checkCharacterConditions_CA(character, args) {
            if (!character?.isBattler?.()) return false;
            let met = true;
            if (args.lifeCondition !== 'none') {
                const isAlive = character.battler().isAlive();
                if ((args.lifeCondition === 'alive' && !isAlive) || (args.lifeCondition === 'dead' && isAlive)) met = false;
            }
            if (met && args.hasStatesCondition) {
                const states = JSON.parse(args.hasStatesCondition).map(Number);
                if (states.length > 0 && !states.every(id => character.battler().battler().isStateAffected(id))) met = false;
            }
            if (met && args.notHasStatesCondition) {
                const states = JSON.parse(args.notHasStatesCondition).map(Number);
                if (states.length > 0 && states.some(id => character.battler().battler().isStateAffected(id))) met = false;
            }
            return met;
        }
        PluginManager.registerCommand(unifiedPluginName, "filterThisEvent", function(args) {
            const eventId = this.eventId();
            const resultVarId = Number(args.resultVariableId);
            if (eventId <= 0 || resultVarId <= 0) return;
            const character = $gameMap.event(eventId);
            if (checkCharacterConditions_CA(character, args)) {
                $gameVariables.setValue(resultVarId, eventId);
            } else if (args.onFail === 'reset_to_zero') {
                $gameVariables.setValue(resultVarId, 0);
            }
        });
        PluginManager.registerCommand(unifiedPluginName, "filterEventById", function(args) {
            const sourceVarId = Number(args.sourceVariableId);
            const resultSwitchId = Number(args.resultSwitchId);
            if (sourceVarId <= 0 || resultSwitchId <= 0) {
                if (resultSwitchId > 0) $gameSwitches.setValue(resultSwitchId, false);
                return;
            }
            const eventId = $gameVariables.value(sourceVarId);
            const character = eventId > 0 ? $gameMap.event(eventId) : null;
            $gameSwitches.setValue(resultSwitchId, checkCharacterConditions_CA(character, args));
        });
        PluginManager.registerCommand(unifiedPluginName, "checkThisEvent", function(args) {
            const resultSwitchId = Number(args.resultSwitchId);
            if (resultSwitchId <= 0) return;
            const eventId = this.eventId();
            const character = eventId > 0 ? $gameMap.event(eventId) : null;
            $gameSwitches.setValue(resultSwitchId, checkCharacterConditions_CA(character, args));
        });
    PluginManager.registerCommand(unifiedPluginName, "findEventBySelfVariable", function(args) {
        const resultVarId = Number(args.resultVariableId);
        if (resultVarId <= 0) return;

        // --- START OF THINKING TIME AND STAGGERING LOGIC ---
        const subject = (args.subjectCharacter === 'player') ? $gamePlayer : (this.eventId() > 0 ? $gameMap.event(this.eventId()) : $gamePlayer);
        if (!subject) {
            $gameVariables.setValue(resultVarId, 0);
            return;
        }

        const thinkingTime = Number(args.thinkingTime) || 0;
        let isTimeToThink = (thinkingTime === 0);

        if (thinkingTime > 0) {
            if (subject instanceof Game_Event) {
                const offset = subject.eventId() % thinkingTime;
                if ((Graphics.frameCount + offset) % thinkingTime === 0) {
                    isTimeToThink = true;
                }
            } else {
                // For the player, use a simple timer.
                // Re-using 'lastPathfindFrame' to avoid adding more properties.
                const lastSearch = subject.arpgTempData().lastPathfindFrame || 0;
                if (Graphics.frameCount - lastSearch >= thinkingTime) {
                    isTimeToThink = true;
                    subject.arpgTempData().lastPathfindFrame = Graphics.frameCount;
                }
            }
        }

        if (!isTimeToThink) {
            return;
        }
        // --- END OF THINKING TIME AND STAGGERING LOGIC ---

        let criteriaList = [];
        try {
            if (args.selfVariableCriteria?.length > 2) {
                criteriaList = JSON.parse(args.selfVariableCriteria).map(item => typeof item === 'string' ? JSON.parse(item) : item);
            }
        } catch (e) {
            console.error("ContextAware: Error parsing criteria JSON.", e);
            $gameVariables.setValue(resultVarId, 0); return;
        }

        if (criteriaList.length === 0) { $gameVariables.setValue(resultVarId, 0); return; }
        
        const maxDist = Number(args.maxDistance) || 0;
        const criteria = criteriaList.map(c => ({
            id: $gameVariables.value(Number(c.id)),
            value: c.valueByVariable > 0 ? $gameVariables.value(Number(c.valueByVariable)) : Number(c.value),
        })).filter(c => c.id > 0);

        if (criteria.length === 0) { $gameVariables.setValue(resultVarId, 0); return; }
        
        const getDist = (a, b) => a.calcFar ? a.calcFar(b) : Math.hypot($gameMap.deltaX(a.x, b.x), $gameMap.deltaY(a.y, b.y));
        
        const candidates = $gameMap.events().filter(e => {
            if (!e?.selfVariableValue || (subject === e) || (maxDist > 0 && getDist(subject, e) > maxDist)) return false;
            const check = c => e.selfVariableValue(c.id) === c.value;
            return (args.criteriaLogic === 'and') ? criteria.every(check) : criteria.some(check);
        });

        if (candidates.length === 0) {
            $gameVariables.setValue(resultVarId, 0);
            return;
        }

        candidates.sort((a, b) => getDist(subject, a) - getDist(subject, b));
        $gameVariables.setValue(resultVarId, candidates[0].eventId());
    });
        const _Game_Event_initMembers_ca_timer = Game_Event.prototype.initMembers;
        Game_Event.prototype.initMembers = function() {
            _Game_Event_initMembers_ca_timer.call(this);
            this._contextTimers = {};
        };
        const _Game_Event_update_ca_timer = Game_Event.prototype.update;
        Game_Event.prototype.update = function() {
            _Game_Event_update_ca_timer.call(this);
            this.updateContextTimers();
        };
        Game_Event.prototype.setContextSwitchValue = function(id, value) {
            if ($gameSwitches.isExSelfSwitch?.(id)) this.setExSelfSwitchValue(id, value);
            else $gameSwitches.setValue(id, value);
        };
        Game_Event.prototype.setContextVariableValue = function(id, value) {
            if ($gameVariables.isSelfVariable?.(id)) this.setSelfVariableValue(id, value);
            else $gameVariables.setValue(id, value);
        };
        Game_Event.prototype.updateContextTimers = function() {
            if (!this._contextTimers) return;
            for (const timerId in this._contextTimers) {
                const timer = this._contextTimers[timerId];
                if (timer?.isRunning) {
                    timer.remainingFrames--;
                    if (timer.resultVariableId > 0) this.setContextVariableValue(timer.resultVariableId, timer.remainingFrames);
                    if (timer.remainingFrames <= 0) {
                        timer.isRunning = false;
                        if (timer.resultSwitchId > 0) this.setContextSwitchValue(timer.resultSwitchId, true);
                        if (timer.resultVariableId > 0) this.setContextVariableValue(timer.resultVariableId, 0);
                    }
                }
            }
        };
        PluginManager.registerCommand(unifiedPluginName, "manageContextTimer", function(args) {
            const event = this.eventId() > 0 ? $gameMap.event(this.eventId()) : null;
            if (!event || !args.timerId) return;
            if (!event._contextTimers) event._contextTimers = {};
            const timer = event._contextTimers[args.timerId] || {};
            event._contextTimers[args.timerId] = timer;
            if (args.operation === 'start') {
                const thinkFrames = (Number(args.thinkingTime) || 0) * (args.thinkingTimeUnit === 'seconds' ? 60 : 1);
                if (timer.lastStartFrame && (Graphics.frameCount - timer.lastStartFrame < thinkFrames)) return;
                const durationFrames = (Number(args.duration) || 1) * (args.durationUnit === 'seconds' ? 60 : 1);
                Object.assign(timer, {
                    isRunning: true, remainingFrames: durationFrames, lastStartFrame: Graphics.frameCount,
                    resultSwitchId: Number(args.resultSwitchId) || 0, resultVariableId: Number(args.resultVariableId) || 0
                });
                if (timer.resultSwitchId > 0) event.setContextSwitchValue(timer.resultSwitchId, false);
                if (timer.resultVariableId > 0) event.setContextVariableValue(timer.resultVariableId, durationFrames);
            }
        });
        PluginManager.registerCommand(unifiedPluginName, "changeState", function(args) {
            const character = this.findCharacterBySpecification(JSON.parse(args.character));
            if (!character?.isBattler?.()) return;
            const stateId = Number(args.stateId);
            if (stateId <= 0) return;
            const battler = character.battler().battler();
            if (args.operation === 'add') battler.addState(stateId);
            else if (args.operation === 'remove') battler.removeState(stateId);
        });
        if (!Game_Interpreter.prototype.findCharacterBySpecification) {
            Game_Interpreter.prototype.findCharacterBySpecification = function() {
                console.warn("ContextAware: 'findCharacterBySpecification' is not available. Requires ARPG_Core.js");
                return null;
            };
        }
    })();
    // ============================================================================
    // END: ContextAware.js
    // ============================================================================


    // ============================================================================
    // START: ARPG_CompatibilityPatch.js
    // ============================================================================
    (() => {
        Game_Character.prototype.getSprite = function() {
            if (SceneManager._scene instanceof Scene_Map && SceneManager._scene._spriteset) {
                return SceneManager._scene._spriteset.findTargetSprite(this);
            }
            return null;
        };
        if (!Spriteset_Map.prototype.findTargetSprite) {
            Spriteset_Map.prototype.findTargetSprite = function(target) {
                return this._characterSprites.find(sprite => sprite.character() === target);
            };
        }
        if (!Sprite_Character.prototype.character) {
            Sprite_Character.prototype.character = function() { return this._character; };
        }
        const _Scene_Boot_onDatabaseLoaded_cp = Scene_Boot.prototype.onDatabaseLoaded;
        Scene_Boot.prototype.onDatabaseLoaded = function() {
            _Scene_Boot_onDatabaseLoaded_cp.call(this);
            if (typeof window.ARPG_Battler === 'undefined') {
                console.error("Faction Patch: ARPG_Core.js has not exposed ARPG_Battler.");
                return;
            }
            const _ARPG_Battler_recvDamageProcess_cp = window.ARPG_Battler.prototype.recvDamageProcessBySkillObjectCharacter;
            window.ARPG_Battler.prototype.recvDamageProcessBySkillObjectCharacter = function(skillObjectCharacter) {
                if (skillObjectCharacter.isErased()) return;
                const skillObject = skillObjectCharacter.skillObject();
                if (!skillObject) return;
                const note = skillObject.skill().data().note;
                const target = this.user();
                const targetFactionMatch = note.match(/<targetFaction:\s*(\d+)\s*,\s*([^>]+)\s*>/);
                if (targetFactionMatch) {
                    if (target.selfVariableValue && String(target.selfVariableValue(parseInt(targetFactionMatch[1], 10))) === targetFactionMatch[2].trim()) {
                        skillObject.applyDamageEffectToBattler(this, skillObject.skill());
                    }
                    return;
                }
                const ignoreFactionMatch = note.match(/<ignoreFaction:\s*(\d+)\s*,\s*([^>]+)\s*>/);
                if (ignoreFactionMatch) {
                    if (target.selfVariableValue && String(target.selfVariableValue(parseInt(ignoreFactionMatch[1], 10))) === ignoreFactionMatch[2].trim()) {
                        return;
                    }
                }
                _ARPG_Battler_recvDamageProcess_cp.call(this, skillObjectCharacter);
            };
            console.log("ARPG Compatibility Patch: Faction System loaded.");
        };
    })();
    // ============================================================================
    // END: ARPG_CompatibilityPatch.js
    // ============================================================================

})();
//=============================================================================
// END OF EXECUTABLE CODE
//=============================================================================