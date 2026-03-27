import { NextRequest, NextResponse } from 'next/server';

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GIST_DESCRIPTION = 'gastos-nathan-sync-data';

async function findGist(): Promise<string | null> {
  const res = await fetch('https://api.github.com/gists?per_page=100', {
    headers: {
      'Authorization': `token ${GITHUB_TOKEN}`,
      'Accept': 'application/vnd.github.v3+json',
    },
  });
  if (!res.ok) return null;
  const gists = await res.json();
  const gist = gists.find((g: any) => g.description === GIST_DESCRIPTION);
  return gist?.id || null;
}

async function createGist(data: any): Promise<string> {
  const res = await fetch('https://api.github.com/gists', {
    method: 'POST',
    headers: {
      'Authorization': `token ${GITHUB_TOKEN}`,
      'Accept': 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      description: GIST_DESCRIPTION,
      public: false,
      files: {
        'gastos-nathan-data.json': {
          content: JSON.stringify(data),
        },
      },
    }),
  });
  const gist = await res.json();
  return gist.id;
}

async function updateGist(gistId: string, data: any): Promise<void> {
  await fetch(`https://api.github.com/gists/${gistId}`, {
    method: 'PATCH',
    headers: {
      'Authorization': `token ${GITHUB_TOKEN}`,
      'Accept': 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      files: {
        'gastos-nathan-data.json': {
          content: JSON.stringify(data),
        },
      },
    }),
  });
}

async function readGist(gistId: string): Promise<any> {
  const res = await fetch(`https://api.github.com/gists/${gistId}`, {
    headers: {
      'Authorization': `token ${GITHUB_TOKEN}`,
      'Accept': 'application/vnd.github.v3+json',
    },
  });
  if (!res.ok) return null;
  const gist = await res.json();
  const content = gist.files?.['gastos-nathan-data.json']?.content;
  if (!content) return null;
  return JSON.parse(content);
}

// GET - Load data from gist
export async function GET() {
  try {
    if (!GITHUB_TOKEN) {
      return NextResponse.json({ error: 'Token not configured' }, { status: 500 });
    }
    const gistId = await findGist();
    if (!gistId) {
      return NextResponse.json({ data: null });
    }
    const data = await readGist(gistId);
    return NextResponse.json({ data });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to load' }, { status: 500 });
  }
}

// POST - Save data to gist
export async function POST(request: NextRequest) {
  try {
    if (!GITHUB_TOKEN) {
      return NextResponse.json({ error: 'Token not configured' }, { status: 500 });
    }
    const data = await request.json();
    let gistId = await findGist();
    if (gistId) {
      await updateGist(gistId, data);
    } else {
      gistId = await createGist(data);
    }
    return NextResponse.json({ success: true, gistId });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to save' }, { status: 500 });
  }
}
