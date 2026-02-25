# Permission Naming Best Practices

## Naming Convention

- **Format:** `ACTION_RESOURCE` (UPPER_SNAKE_CASE)
- **Examples:** `CREATE_STUDENT`, `VIEW_REPORT`, `MANAGE_FEES`

## Rules

1. **Action verb first** – `CREATE`, `VIEW`, `UPDATE`, `DELETE`, `MANAGE`
2. **Resource second** – `STUDENT`, `TEACHER`, `FEES`, `REPORT`
3. **Be specific** – `VIEW_STUDENT` not `VIEW`; `MANAGE_FEES` not `EDIT_FEES`
4. **One permission per action+resource** – avoid overlapping (e.g. `EDIT_STUDENT` vs `UPDATE_STUDENT`; pick one)

## Adding New Permissions

1. Add a row to `permissions` (via seed or migration).
2. Assign to roles via `role_permissions`.
3. Run seed if using seed script, or insert manually.
4. Users must re-login (or refresh token) to get new permissions in their JWT.
