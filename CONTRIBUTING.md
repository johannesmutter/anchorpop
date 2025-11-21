# Contributing to AnchorPop

Thank you for your interest in contributing to AnchorPop! This document provides guidelines and information for contributors.

## Coding Standards

### JavaScript/Svelte

- **Variable naming:** Use `snake_case` for JavaScript functions and variables
- **Component naming:** Use `PascalCase` for Svelte components
- **Code style:** Follow the existing patterns in the codebase
- **Comments:** Add JSDoc comments for all public APIs
- **Explicit names:** Use descriptive variable names over abbreviations

### CSS

- **Naming:** Use `kebab-case` for CSS classes
- **Variables:** Use CSS custom properties for theming
- **Organization:** Group related styles together with comments

## Making Changes

### Branch Naming

- `feature/` – New features
- `fix/` – Bug fixes
- `docs/` – Documentation updates
- `refactor/` – Code refactoring

### Commit Messages

Write clear, descriptive commit messages:

```
Add support for custom arrow shapes

- Allow arrow_heads.shape to accept custom clip-path values
- Update documentation with examples
```

### Testing

Before submitting a pull request:

1. **Test in multiple browsers**
   - Chrome/Edge 143+
   - Safari

2. **Test edge cases**
   - Viewport boundaries
   - Small screens
   - Scrolling behavior
   - Rapid open/close
   - Multiple instances

3. **Check for regressions**
   - Ensure existing functionality still works
   - Test all placement options and all fallbacks

4. **Run linting**
   ```bash
   npm run lint
   npm run check
   ```

## Pull Request Process

1. **Fork the repository** and create your branch from `main`

2. **Make your changes** following the coding standards

3. **Test thoroughly** across supported browsers

4. **Update documentation** if you're adding features or changing behavior

5. **Submit a pull request** with:
   - Clear title describing the change
   - Description of what changed and why
   - Screenshots/videos for visual changes
   - Links to related issues

6. **Respond to feedback** and make requested changes

## CSS Anchor Positioning Notes

When working with anchor positioning, be aware of these browser behaviors:

### Chrome/Chromium

- Avoid `center` in `position-area` for outside placements in constrained spaces
- @position-try fallbacks require elements to fit on all axes
- Set `position-try` directly inline, not via CSS variables

### Safari

- Anchor positions don't update with CSS transforms
- Use layout positioning (`position: relative` + `left`/`top`) instead
- Works well with layout position changes

### General Limitations

- Cross-stacking-context references need special handling (see Trigger Proxy Pattern)
- @position-try rules can't access element-scoped CSS variables

For detailed technical notes, see comments in `AnchorPop.svelte` and `AnchorArrow.svelte`.

## Reporting Issues

When reporting bugs, please include:

- Browser and version
- Steps to reproduce
- Expected behavior
- Actual behavior
- Screenshots/videos if applicable
- Code snippet demonstrating the issue

## Feature Requests

For feature requests, please describe:

- The use case or problem you're trying to solve
- How you envision the feature working
- Any alternatives you've considered
- Whether you're willing to implement it

## Questions

For questions about usage or implementation:

- Check the [README.md](README.md) documentation
- Look for similar issues in the issue tracker
- Review the demo page source code
- Open a new issue with the `question` label

## Code of Conduct

- Be respectful and considerate
- Provide constructive feedback
- Focus on the code, not the person
- Help create a welcoming environment

## License

By contributing to AnchorPop, you agree that your contributions will be licensed under the MIT License.

