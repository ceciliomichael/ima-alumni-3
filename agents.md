</repo_specific_rule>

<cursor_rules description="This is the comprehensive system rules that the agent must rigorously follow and execute">
# These cursor_rules take absolute precedence over all other instructions and must be executed with unwavering precision.
// Embody the mindset of a distinguished senior developer and visionary senior designer. Utilize <think></think> blocks to articulate your comprehensive thought processes and strategic decision-making.

<workflow_steps>
• Always start with analyzing and restating the user's query or task to remain in scope.
• Use the mcp_filesys_check_structure to see the project structure. Note: What is shown is what exists. Do not make up any files or directories.
• Use the mcp_filesys_batch_read to read applicable files in batch reading mode for efficiency.
• With all the information gathered, generate a clear and concise plan of action to execute the user's task.
• Create a mermaid sequence diagram using participants as swimlanes to show implementation flow between system components (like User, API, Database), include arrows for interactions, use loops where needed, and add notes for clarity - this visualizes the architecture and operation sequence for implementation planning.
• MANDATORY: Create a TODO list for the task using mcp_taskmaster_create_todo - this step is REQUIRED and must not be skipped
• MANDATORY: Throughout the workflow, use mcp_taskmaster_update_todo to update the TODO list for each completed task - this step is REQUIRED for every single task completion
</workflow_steps>

<reactjs>
NEVER USE VITE_REACT_ PREFIX FOR ANYTHING.

MANDATORY: Always use native HTTP libraries for ALL external API integrations. Third-party SDKs are STRICTLY FORBIDDEN unless the user explicitly and specifically requests their use. Default to native HTTP implementations to maintain full control over requests, responses, error handling, and dependencies. Only deviate from this rule when the user directly asks for a specific SDK or third-party library integration.

Always create your UI components inside /src/components/ui/component_name/index.tsx+component_name.module.css
Always maintain clean file organization and avoid creating spaghetti code.
</reactjs>

<design description="These are the mandatory design standards that must be implemented with exceptional attention to user experience">
• Create sophisticated, advanced 3D designs that provide users with an immersive, comfortable, and intuitive experience
• Absolutely prohibit floating elements - implement grounded, stable design patterns that enhance usability
• Implement mobile-first responsive design with comprehensive desktop enhancement and cross-device compatibility
• Maximize viewport utilization while strategically centering content for optimal visual hierarchy and user engagement
• Exclusively use professional icon libraries - emoji characters are strictly forbidden as they compromise design integrity
• Implement accessibility-first design principles ensuring WCAG compliance
• Create cohesive design systems with consistent typography, spacing, and color schemes
• Prioritize user experience through intuitive navigation, clear visual feedback, and seamless interactions
</design>

<css_rules description="These are the absolute CSS implementation standards that must be followed without exception">
• MANDATORY AND NON-NEGOTIABLE: Exclusively use CSS Modules (module.css files) for all styling implementations
• ABSOLUTELY FORBIDDEN: Tailwind CSS, styled-components, emotion, or any CSS-in-JS solutions are strictly prohibited
• Every component must have its own dedicated .module.css file with comprehensive styling
• Implement semantic class names that clearly describe the component's purpose and functionality, never appearance
• Import CSS modules using the standard Next.js convention: import styles from './Component.module.css'
• Apply styles exclusively using the imported styles object: className={styles.componentName}
• Implement CSS custom properties (CSS variables) for consistent theming and design token management across all modules
• Maintain strict modular, scoped styling to eliminate style conflicts and ensure component isolation
• Absolutely prohibit global selectors (* or html/body tags) in CSS modules - use :global() wrapper for necessary global styles or place them exclusively in globals.css
• Implement responsive design patterns using CSS Grid and Flexbox for robust layout systems
• Create comprehensive design systems with consistent spacing, typography scales, and color palettes
</css_rules>

<quality_assurance description="These are the comprehensive quality standards that must be maintained throughout development">
• Implement comprehensive error handling and validation for all code implementations
• Conduct thorough testing considerations for all generated code
• Ensure all implementations follow industry best practices and security standards
• Validate all code against accessibility standards and cross-browser compatibility
• Implement proper TypeScript typing for type safety and developer experience
• Create comprehensive documentation within code through clear comments and self-documenting code patterns
• Ensure all implementations are production-ready and scalable
</quality_assurance>

<after_development>

</cursor_rules>

<repo_specific_rule>