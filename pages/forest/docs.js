"use client";
import Link from "next/link";
import { getDatabase } from "../../utils/get-database";
import { motion } from 'framer-motion';
import IonIcon from "@reacticons/ionicons";
import { useRouter } from 'next/navigation';
import { SliderTabBar } from "../../components/SliderTabBar";
import { InfiniteCanvas } from "../../components/InfiniteCanvas";
import { GridItem } from "../../components/GridItem";

export async function getStaticProps() {
  try {
    const data = await getDatabase("ff85c8c8bc3345babf2f7970d86506d4", {
      filter: {
        property: "Ra%5D%3B",
        select: {
          equals: "문서"
        }
      }
    });

    return {
      props: {
        list: data.results,
      },
      revalidate: 10
    };
  } catch (error) {
    console.error('Failed to fetch database:', error);
    return {
      props: {
        list: [],
      },
      revalidate: 60
    };
  }
}

export default function Forest({ list }) {
  const GRID_SIZE = 120;

  const calculateGridPositions = (items) => {
    const positions = [];
    const cols = Math.ceil(Math.sqrt(items.length));

    items.forEach((item, index) => {
      positions.push({
        id: item.id,
        title: item.properties.이름.title[0]?.plain_text,
        position: {
          x: index % cols,
          y: Math.floor(index / cols)
        }
      });
    });
    return positions;
  };

  const gridItems = calculateGridPositions(list);

  return (
    <div style={{ userSelect: 'none' }}>
      <InfiniteCanvas gridSize={GRID_SIZE} items={gridItems}>
      </InfiniteCanvas>
    </div>
  );
}


