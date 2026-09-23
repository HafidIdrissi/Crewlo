/** Only display a short operation and basename, never command arguments or file contents. */
export function toolActivity(tool: string | undefined, input: unknown): string | undefined {
  if (!tool) return undefined;
  const data = input && typeof input === 'object' ? input as Record<string, unknown> : {};
  const path = data.file_path ?? data.path ?? data.filename;
  const file = typeof path === 'string' ? path.split(/[\\/]/).pop()?.replace(/[\x00-\x1f\x7f]/g, '').slice(0, 64) : undefined;
  const name = tool.split(/[.:]/).pop()!.toLowerCase();
  if (name === 'write') return file ? `Writing ${file}` : 'Writing a file';
  if (['edit', 'multiedit'].includes(name)) return file ? `Editing ${file}` : 'Editing files';
  if (['read', 'read_file'].includes(name)) return file ? `Reading ${file}` : 'Reading a file';
  if (['grep', 'glob', 'search'].includes(name)) return 'Searching files';
  if (name === 'apply_patch') {
    const patch = typeof input === 'string' ? input : data.patch ?? data.input;
    const match = typeof patch === 'string' && patch.match(/^\*\*\* (Add|Update|Delete) File: (.+)$/m);
    if (match) return `${match[1] === 'Add' ? 'Creating' : match[1] === 'Delete' ? 'Removing' : 'Editing'} ${match[2].split(/[\\/]/).pop()!.slice(0, 64)}`;
    return 'Editing files';
  }
  if (/browser.*resize|resize.*browser/.test(tool)) return 'Checking responsiveness';
  if (/screenshot/.test(name)) return 'Capturing a screenshot';
  if (['bash', 'shell', 'exec_command', 'run_shell_command'].includes(name)) {
    const command = data.command ?? data.cmd;
    if (typeof command === 'string') {
      if (/\b(?:npm|pnpm|yarn)\s+(?:run\s+)?(?:test|check)\b|\b(?:pytest|vitest)\b|\b(?:cargo|go)\s+test\b/.test(command)) return 'Running tests';
      if (/\b(?:npm|pnpm|yarn)\s+(?:run\s+)?build\b/.test(command)) return 'Building the project';
      if (/\b(?:tsc|typecheck)\b/.test(command)) return 'Checking types';
    }
    return 'Running a command';
  }
  return 'Using a tool';
}
