## ADDED Requirements

### Requirement: Display plugin list
The Host UI SHALL display all discovered plugins in a list/grid with their name, status, and action buttons.

#### Scenario: Render plugin list on load
- **WHEN** the Host UI loads
- **THEN** it SHALL send `pm:list` to fetch all plugins
- **THEN** each plugin SHALL be rendered as a card showing displayName, version, status badge

#### Scenario: Update list on change
- **WHEN** the plugin list changes (install/uninstall/status change)
- **THEN** the Host UI SHALL update reactively without page reload

### Requirement: Plugin card actions
Each plugin card SHALL provide action buttons based on current plugin status.

#### Scenario: Closed plugin shows open button
- **WHEN** a plugin status is "closed"
- **THEN** the card SHALL show an [Open] button
- **THEN** clicking [Open] SHALL invoke `pm:open`

#### Scenario: Opened plugin shows close button
- **WHEN** a plugin status is "opened"
- **THEN** the card SHALL show a [Close] button
- **THEN** clicking [Close] SHALL invoke `pm:close`

#### Scenario: All plugins show uninstall button
- **WHEN** any plugin is displayed
- **THEN** an [Uninstall] button SHALL be available
- **THEN** clicking [Uninstall] SHALL invoke `pm:uninstall`

### Requirement: Install bar
The Host UI SHALL provide an input area to install a new plugin by directory name.

#### Scenario: Install plugin from input
- **WHEN** user enters a plugin directory name in the InstallBar
- **WHEN** user clicks [Install]
- **THEN** the Host UI SHALL invoke `pm:install`
- **THEN** on success, the plugin list SHALL update
- **THEN** on failure, an error message SHALL be displayed

### Requirement: Scan button
The Host UI SHALL provide a [Scan] button to manually trigger plugin discovery.

#### Scenario: Manual rescan
- **WHEN** user clicks [Scan]
- **THEN** the Host UI SHALL invoke `pm:scan`
- **THEN** the plugin list SHALL update with any newly discovered plugins
