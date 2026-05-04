const fs = require('fs');
let code = fs.readFileSync('src/app/evento/[id]/page.test.tsx', 'utf8');

// Replace multiline mockEq.mockResolvedValue
code = code.replace(/__mockEq\.mockResolvedValue\(\{\s*data:\s*(\[[\s\S]*?\]),\s*error:\s*null\s*\}\);/g, 
  "__mockEq.mockReturnValue({ eq: vi.fn().mockReturnThis(), order: __mockOrder, then: (res: any) => res({ data: $1, error: null }) });");

fs.writeFileSync('src/app/evento/[id]/page.test.tsx', code);
