import IonIcon from '@reacticons/ionicons';
import { useEffect, useId, useState } from 'react';

interface Comment {
    id: string;
    created_by: { id: string };
    rich_text: Array<{ plain_text: string }>;
    created_time: string;
}

const ownerId = 'b134fa0d-0a42-457c-be65-3fcc91bd5c0e';
const dateFormat = new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit',
});

const nicknameAdjectives = [
    '고요한', '다정한', '느긋한', '용감한', '반짝이는', '부지런한', '유쾌한', '차분한',
    '포근한', '싱그러운', '씩씩한', '엉뚱한', '가벼운', '따뜻한', '호기심 많은', '자유로운',
];
const nicknameNouns = [
    '수달', '오리', '여우', '다람쥐', '고래', '고양이', '펭귄', '토끼', '참새', '판다',
    '고슴도치', '나비', '돌고래', '거북이', '해달', '물개', '구름', '별', '새싹', '단풍',
];

function visitorNickname(commentId: string) {
    // Notion의 방문 댓글은 같은 연동 계정을 사용하므로 댓글 ID로 이름을 정한다.
    let hash = 2166136261;
    for (const character of commentId) {
        hash = Math.imul(hash ^ character.charCodeAt(0), 16777619);
    }
    const index = hash >>> 0;
    const adjective = nicknameAdjectives[index % nicknameAdjectives.length];
    const noun = nicknameNouns[Math.floor(index / nicknameAdjectives.length) % nicknameNouns.length];
    return `${adjective} ${noun}`;
}

export default function Comments({ pageId }: { pageId: string }) {
    return <CommentThread key={pageId} pageId={pageId} />;
}

function CommentThread({ pageId }: { pageId: string }) {
    const headingId = useId();
    const noteId = useId();
    const [comments, setComments] = useState<Comment[]>([]);
    const [draft, setDraft] = useState('');
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState(false);
    const [posting, setPosting] = useState(false);
    const [postError, setPostError] = useState(false);
    const [reload, setReload] = useState(0);

    useEffect(() => {
        const controller = new AbortController();
        setLoading(true);
        setLoadError(false);
        async function load() {
            try {
                const response = await fetch(`/api/comments/${pageId}`, { signal: controller.signal });
                if (!response.ok) throw new Error('Comments request failed');
                const data = await response.json();
                if (!Array.isArray(data.results)) throw new Error('Invalid comments response');
                if (!controller.signal.aborted) setComments(data.results);
            } catch {
                if (!controller.signal.aborted) setLoadError(true);
            } finally {
                if (!controller.signal.aborted) setLoading(false);
            }
        }
        void load();
        return () => controller.abort();
    }, [pageId, reload]);

    async function submit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (posting || !draft.trim()) return;
        setPosting(true);
        setPostError(false);
        try {
            const response = await fetch(`/api/comments/${pageId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content: draft }),
            });
            if (!response.ok) throw new Error('Comment submission failed');
            setDraft('');
            setReload((version) => version + 1);
        } catch {
            setPostError(true);
        } finally {
            setPosting(false);
        }
    }

    return (
        <section className="blog-comments" aria-labelledby={headingId}>
            <h2 id={headingId}>댓글 {!loading && !loadError && <span>{comments.length}</span>}</h2>
            <form className="blog-comment-composer" onSubmit={submit} aria-busy={posting}>
                <textarea
                    aria-label="댓글 내용"
                    aria-describedby={noteId}
                    rows={3}
                    value={draft}
                    maxLength={2000}
                    readOnly={posting}
                    onChange={(event) => {
                        setDraft(event.target.value);
                        if (postError) setPostError(false);
                    }}
                    placeholder="댓글을 남겨 주세요"
                />
                <div className="blog-comment-actions">
                    <p id={noteId}>등록한 댓글은 수정하거나 삭제할 수 없어요.</p>
                    <button type="submit" disabled={posting || !draft.trim()}>
                        {posting ? '등록 중…' : '댓글 등록'}
                    </button>
                </div>
            </form>
            {postError && <p className="blog-comments-feedback" role="alert">댓글을 등록하지 못했어요. 다시 시도해 주세요.</p>}
            {loading && <p className="blog-comments-feedback" role="status">댓글을 불러오고 있어요…</p>}
            {loadError && <div className="blog-comments-feedback" role="alert">
                댓글을 불러오지 못했어요.
                <button type="button" onClick={() => setReload((version) => version + 1)}>다시 시도</button>
            </div>}
            {!loading && !loadError && comments.length === 0 &&
                <p className="blog-comments-feedback">첫 댓글을 남겨 보세요.</p>}
            {comments.length > 0 && <ol className="blog-comment-list" aria-label="댓글 목록">
                {comments.map((comment) => {
                    const isOwner = comment.created_by.id === ownerId;
                    const name = isOwner ? '태인' : visitorNickname(comment.id);
                    return <li key={comment.id} className="blog-comment">
                        <span className="blog-comment-avatar" data-owner={isOwner} aria-hidden="true">
                            {name[0]}
                        </span>
                        <div className="blog-comment-content">
                            <div className="blog-comment-meta">
                                <strong className="blog-comment-author">
                                    {name}
                                    {isOwner && <span className="blog-comment-owner" role="img" aria-label="블로그 운영자" title="블로그 운영자">
                                        <IonIcon name="checkmark-circle" aria-hidden="true" />
                                    </span>}
                                </strong>
                                <time dateTime={comment.created_time}>{dateFormat.format(new Date(comment.created_time))}</time>
                            </div>
                            <p>{comment.rich_text.map((part) => part.plain_text).join('')}</p>
                        </div>
                    </li>;
                })}
            </ol>}
        </section>
    );
}
