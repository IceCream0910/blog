import * as React from 'react'
import styles from './styles.module.css'

interface BacklinksProps {
  currentId: string
}

export const Backlinks: React.FC<BacklinksProps> = ({ currentId }) => {
  const [backlinks, setBacklinks] = React.useState(null)
  const [map, setMap] = React.useState(null)
  const [list, setList] = React.useState(null)

  React.useEffect(() => {
    fetch('/api/backlink', {
      method: 'POST',
      body: JSON.stringify({ currentId }),
      headers: {
        'Content-Type': 'application/json',
      },
    })
      .then((res) => res.json())
      .then((data) => {
        setBacklinks(data.backlinks)
        setMap(data.recordMap);
      })
  }, [currentId]);

  React.useEffect(() => {
    if (!backlinks || !map) return;

    // 모든 backlink에 대한 title과 link를 가져오는 Promise 배열 생성
    const promises = backlinks.map(backlink =>
      fetch('/api/title-notion', {
        method: 'POST',
        body: JSON.stringify({
          block: map.block[backlink.mentioned_from.block_id].value,
          recordMap: map
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      }).then(res => res.json())
    );

    // 모든 Promise가 완료되면 결과를 setList
    Promise.all(promises)
      .then(results => {
        // 중복 제거
        const uniqueResults = results.reduce((acc, current) => {
          const x = acc.find(item => item.title === current.title);
          if (!x) {
            return acc.concat([current]);
          } else {
            return acc;
          }
        }, []);

        uniqueResults.sort((a, b) => {
          if (a.title > b.title) return -1;
          if (a.title < b.title) return 1;
          return 0;
        });

        setList(uniqueResults);
      });

  }, [backlinks, map]);

  if (!backlinks || !map || !list || list.length === 0) {
    return null
  }

  return (
    <div className='backlinks' style={{
      width: '100%',
      backgroundColor: 'var(--card-bg)',
      border: '1px solid var(--fg-color-1)',
      padding: '1em',
      borderRadius: '15px',
      marginTop: '1em',
    }}>
      <b>이 글이 링크된 다른 문서들</b>
      <ul style={{ paddingLeft: '10px', fontSize: '16px', marginTop: '5px', marginBottom: 0 }}>
        {list.map((item, index) => (
          <li key={index} style={{ listStyle: 'inside', margin: 0 }}>
            <a className='no-underline hover:underline'
              style={{ color: 'var(--tag-text)' }}
              href={`/${item.link}`}
            >
              {item.title}
            </a>
          </li>
        ))}
      </ul>
    </div>
  )
}
