## ADDED Requirements

### Requirement: Markdown Note Creation
The system SHALL provide users the ability to create new notes using markdown formatting with a dedicated editing interface.

#### Scenario: User creates a new note
- **WHEN** user clicks the "新建" (New) button or "创建新笔记" (Create New Note) suggestion card
- **THEN** the system SHALL display a note editor with split-screen layout
- **AND** the left pane SHALL contain a markdown text input area
- **AND** the right pane SHALL display a live preview of the rendered markdown

#### Scenario: User edits existing note content
- **WHEN** user types in the markdown editor
- **THEN** the system SHALL update the preview pane in real-time
- **AND** the system SHALL render markdown formatting, math formulas, and code syntax highlighting
- **AND** the system SHALL indicate unsaved changes with a visual indicator

### Requirement: Note Persistence and Management
The system SHALL provide local storage and management functionality for user notes.

#### Scenario: User saves a note
- **WHEN** user clicks the save button or auto-save is triggered
- **THEN** the system SHALL store the note in localStorage with unique ID
- **AND** the system SHALL include title, content, creation timestamp, and last modified timestamp
- **AND** the system SHALL return the user to the notes list view

#### Scenario: User views all notes
- **WHEN** user navigates to the notes section
- **THEN** the system SHALL display a list of all saved notes
- **AND** each note item SHALL show title, creation date, and last modified date
- **AND** the system SHALL provide options to edit or delete each note

#### Scenario: User searches notes
- **WHEN** user enters search terms in the notes section
- **THEN** the system SHALL filter notes by title and content matching the search terms
- **AND** the system SHALL update the displayed list in real-time

### Requirement: Markdown Rendering Support
The system SHALL support comprehensive markdown rendering including mathematical formulas and code highlighting.

#### Scenario: Note contains mathematical formulas
- **WHEN** user includes LaTeX-formatted math expressions in markdown
- **THEN** the system SHALL render the formulas using KaTeX library
- **AND** both inline ($...$) and display ($$...$$) math modes SHALL be supported

#### Scenario: Note contains code blocks
- **WHEN** user includes code blocks with language specification in markdown
- **THEN** the system SHALL apply syntax highlighting using Prism.js
- **AND** the system SHALL support common programming languages (JavaScript, Python, Java, C++, etc.)

#### Scenario: Note contains standard markdown elements
- **WHEN** user uses standard markdown syntax (headers, lists, links, images, etc.)
- **THEN** the system SHALL correctly render all markdown elements using marked.js
- **AND** the rendering SHALL be consistent with GitHub-flavored markdown standards

### Requirement: Responsive Design and Accessibility
The system SHALL provide a functional note-taking experience across different device sizes and accessibility needs.

#### Scenario: User accesses notes on mobile device
- **WHEN** screen width is below 768px
- **THEN** the system SHALL switch from split-screen to tabbed interface
- **AND** users SHALL be able to toggle between editor and preview views
- **AND** all functionality SHALL remain accessible and usable

#### Scenario: User uses keyboard shortcuts
- **WHEN** user presses keyboard shortcuts in the editor
- **THEN** the system SHALL support common shortcuts (Ctrl+S for save, Ctrl+B for bold, etc.)
- **AND** the system SHALL provide visual feedback for keyboard actions