import { NextRequest } from 'next/server';
import * as React from 'react';
import '../../styles/globals.css';

import { ImageResponse } from '@vercel/og';

export const config = {
  runtime: 'edge',
};

export default async function handler(req: NextRequest) {
  const fontBlack = await fetch(`${process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'}/fonts/Pretendard-Black.woff`).then((res) => res.arrayBuffer());
  const fontRegular = await fetch(`${process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'}/fonts/Pretendard-Regular.woff`).then((res) => res.arrayBuffer());

  try {
    const { searchParams } = new URL(req.url);
    const { id } = Object.fromEntries(searchParams);

    const result = await fetch(`https://api.notion.com/v1/pages/${id}`, {
      headers: {
        Authorization: `Bearer ${process.env.NOTION_API_KEY}`,
        'Notion-Version': '2022-06-28',
      },
    });

    const data = await result.json();
    const { properties, cover, icon } = data;

    const image = cover?.external?.url || cover?.file?.url || "";
    const title = properties?.['이름']?.title?.[0]?.plain_text || "태인의 Blog";
    const description = properties?.['설명']?.rich_text?.[0]?.plain_text || "";
    const tags = (properties?.['태그']?.multi_select || []).map((tag: any) => tag.name);
    const author = "태인의 Blog";
    const authorImage = "https://whal.eu/i/EWerYvZ7";
    const publishedAt = properties?.['작성일']?.created_time;
    const publishedAtString = publishedAt
      ? new Date(publishedAt).toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
      : "https://blog.yuntae.in";

    return new ImageResponse(
      (
        <div
          style={{
            display: 'flex',
            padding: '46px',
            background: 'linear-gradient(-45deg, #1a1b1e 30%,rgb(61, 71, 130))',
            backdropFilter: 'blur(30px)',
            color: 'white',
            width: '100%',
            height: '100%',
            justifyContent: 'space-between'
          }}
        >
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              flex: 1,
              height: '100%',
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <b><h1 style={{ fontSize: '56px', fontWeight: 'bold', paddingTop: '24px', fontFamily: '"Black"' }}>{title}</h1></b>
              {description && <p style={{ fontSize: '24px', opacity: 0.8, fontFamily: '"Regular"' }}>{description}</p>}
              <div style={{ display: 'flex', fontSize: '22px', opacity: 0.6, fontFamily: '"Regular"' }}>
                {tags.map((tag: string, i) => (
                  <div
                    key={tag}
                    style={{ display: 'flex', marginRight: tags.length === i + 1 ? '' : '10px' }}
                  >
                    #{tag}
                  </div>
                ))}
              </div>
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <img
                src={authorImage}
                style={{
                  width: '100px',
                  height: '100px',
                  objectFit: 'cover',
                  objectPosition: 'center',
                  borderRadius: '50%',
                  marginRight: '16px',
                }}
              />

              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column', fontFamily: '"Regular"'
                }}
              >
                <div style={{ fontSize: '32px', opacity: 0.8 }}>{author}</div>
                <div style={{ fontSize: '20px', opacity: 0.8 }}>코드, 그리고 그 사이의 생각을 기록합니다.</div>
              </div>
            </div>
          </div>



          {icon && icon.type === 'file' && (
            <img
              src={icon.file.url}
              style={{
                width: '200px',
                height: '200px',
                position: 'absolute',
                bottom: '60px',
                right: '70px',
              }}
            />
          )}

          {icon && icon.type === 'external' && (
            <img
              src={icon.external.url}
              style={{
                width: '200px',
                height: '200px',
                position: 'absolute',
                bottom: '60px',
                right: '70px',
              }}
            />
          )}
        </div>
      ),
      {
        width: 1200,
        height: 630,
        fonts: [
          {
            name: 'Black',
            data: fontBlack,
            style: 'normal',
          },
          {
            name: 'Regular',
            data: fontRegular,
            style: 'normal',
          },
        ],
      },
    );
  } catch (e: any) {
    console.error(`${e.message}`);

    return new Response(`Failed to generate the image`, {
      status: 500,
    });
  }
}
