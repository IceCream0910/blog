interface ItemLayout {
    x: number;
    y: number;
    rotation: number;
    scale: number;
    zIndex: number;
    shape: 'circle' | 'rectangle' | 'triangle';
}

// 텍스트를 숫자로 해시화
function hashText(text: string): number {
    return text.split('').reduce((acc, char) => {
        const hash = ((acc << 5) - acc) + char.charCodeAt(0);
        return hash & hash;
    }, 0);
}

// 해시값을 -1 ~ 1 범위로 정규화
function normalizeHash(hash: number): number {
    return (hash % 2000) / 1000 - 1;
}

// 겹침 정도를 계산하는 함수 추가
function calculateOverlap(x1: number, y1: number, x2: number, y2: number): number {
    return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
}

const ITEM_SIZE = 128; // 아이템의 기본 크기
const MIN_DISTANCE = ITEM_SIZE * 0.7; // 최소 중심점 간 거리
const MAX_ATTEMPTS = 10; // 위치 재시도 횟수

export function calculateLayout(title: string, index: number, existingLayouts: ItemLayout[] = []): ItemLayout {
    const hash = hashText(title);
    const shapes: ItemLayout['shape'][] = ['circle', 'rectangle', 'triangle'];
    const shapeIndex = Math.abs(hash) % shapes.length;

    // 기본 방사형 배치 계산
    let bestLayout: ItemLayout | null = null;
    let minOverlap = Infinity;

    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
        const sectionCount = 12 + attempt; // 시도할 때마다 섹션 수 증가
        const sectionAngle = (Math.PI * 2) / sectionCount;
        const baseAngle = ((Math.abs(hash) + attempt) % sectionCount) * sectionAngle;
        const angleOffset = normalizeHash(hash >> (2 + attempt)) * (sectionAngle * 0.5);

        const angle = baseAngle + angleOffset;
        const radiusBase = 200 + (attempt * 50); // 시도할 때마다 반경 증가
        const radius = radiusBase + (Math.abs(normalizeHash(hash >> 3)) * 200);

        const layout = {
            x: Math.cos(angle) * radius,
            y: Math.sin(angle) * radius,
            rotation: normalizeHash(hash >> 4) * 20, // 회전 각도 범위 축소
            scale: 0.95 + (Math.abs(normalizeHash(hash >> 6)) * 0.15), // 크기 변화 범위 축소
            zIndex: index,
            shape: shapes[shapeIndex]
        };

        // 다른 아이템들과의 겹침 정도 확인
        let maxOverlapWithOthers = 0;
        for (const existing of existingLayouts) {
            const overlap = calculateOverlap(layout.x, layout.y, existing.x, existing.y);
            maxOverlapWithOthers = Math.max(maxOverlapWithOthers, MIN_DISTANCE - overlap);
        }

        // 더 나은 위치를 찾았다면 업데이트
        if (maxOverlapWithOthers < minOverlap) {
            minOverlap = maxOverlapWithOthers;
            bestLayout = layout;
        }

        // 충분히 좋은 위치를 찾았다면 중단
        if (minOverlap <= 0) break;
    }

    return bestLayout || {
        x: Math.cos(0) * 200,
        y: Math.sin(0) * 200,
        rotation: 0,
        scale: 1,
        zIndex: index,
        shape: shapes[shapeIndex]
    };
}
