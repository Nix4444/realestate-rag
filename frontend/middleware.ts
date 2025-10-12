import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(req: NextRequest) {
  const token = req.cookies.get('access_token')?.value;
  const { pathname, search } = req.nextUrl;
  if (pathname.startsWith('/chat')) {
    if (!token) {
      const url = req.nextUrl.clone();
      url.pathname = '/signin';
      url.searchParams.set('next', pathname + search);
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  
  if (pathname === '/signin') {
    if (token) {
      const url = req.nextUrl.clone();
      url.pathname = '/chat';
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  return NextResponse.next();
}


export const config = {
  matcher: ['/chat/:path*', '/signin'],
};


