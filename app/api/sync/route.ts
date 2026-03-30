import { NextRequest, NextResponse } from 'next/server';

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const REPO_OWNER = 'skinaura57-ops';
const REPO_NAME = 'gastos-nathan';
const FILE_PATH = 'data/sync.json';
const BRANCH = 'data';

const headers = {
  'Authorization': `token ${GITHUB_TOKEN}`,
  'Accept': 'application/vnd.github.v3+json',
  'Content-Type': 'application/json',
};

// Ensure the 'data' branch exists
async function ensureBranch(): Promise<void> {
  // Check if branch exists
  const res = await fetch(
    `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/git/ref/heads/${BRANCH}`,
    { headers }
  );
  if (res.ok) return;

  // Get main branch SHA
  const mainRes = await fetch(
    `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/git/ref/heads/main`,
    { headers }
  );
  if (!mainRes.ok) return;
  const mainData = await mainRes.json();

  // Create branch
  await fetch(
    `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/git/refs`,
    {
      method: 'POST',
      headers,
      body: JSON.stringify({
        ref: `refs/heads/${BRANCH}`,
        sha: mainData.object.sha,
      }),
    }
  );
}

// Read data from the repo file
async function readData(): Promise<any> {
  const res = await fetch(
    `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${FILE_PATH}?ref=${BRANCH}`,
    { headers }
  );
  if (!res.ok) return null;
  const file = await res.json();
  const content = Buffer.from(file.content, 'base64').toString('utf-8');
  return { data: JSON.parse(content), sha: file.sha };
}

// Write data to the repo file
async function writeData(data: any, sha?: string): Promise<boolean> {
  const content = Buffer.from(JSON.stringify(data)).toString('base64');
  const body: any = {
    message: 'sync: update data',
    content,
    branch: BRANCH,
  };
  if (sha) body.sha = sha;

  const res = await fetch(
    `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${FILE_PATH}`,
    {
      method: 'PUT',
      headers,
      body: JSON.stringify(body),
    }
  );
  return res.ok;
}

// GET - Load data
export async function GET() {
  try {
    if (!GITHUB_TOKEN) {
      return NextResponse.json({ error: 'Token not configured' }, { status: 500 });
    }
    const result = await readData();
    if (!result) {
      return NextResponse.json({ data: null });
    }
    return NextResponse.json({ data: result.data });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to load' }, { status: 500 });
  }
}

// POST - Save data
export async function POST(request: NextRequest) {
  try {
    if (!GITHUB_TOKEN) {
      return NextResponse.json({ error: 'Token not configured' }, { status: 500 });
    }
    const data = await request.json();

    await ensureBranch();

    // Get existing file SHA if it exists
    const existing = await readData();
    const sha = existing?.sha;

    const success = await writeData(data, sha);
    if (!success) {
      return NextResponse.json({ error: 'Failed to write' }, { status: 500 });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to save' }, { status: 500 });
  }
}
