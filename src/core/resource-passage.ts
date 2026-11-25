import {BOOKS} from './books';
import type {BibleResource,VerseData} from './library';
import type {PassageReference} from './references';
import type {ResourceRange} from './resource-links';
export interface ResourceChapter {book:number;chapter:number}
const order=(cursor:ResourceChapter):number=>cursor.book*1000+cursor.chapter;
function inRange(range:ResourceRange,cursor:ResourceChapter):boolean {
 return Number.isInteger(cursor.book)&&cursor.book>=1&&cursor.book<=66&&Number.isInteger(cursor.chapter)&&cursor.chapter>=1&&cursor.chapter<=200
  && order(cursor)>=order(range.start)&&order(cursor)<=order(range.end??range.start);
}
/** Load a single exact chapter; a multi-chapter href never triggers an eager range read. */
export async function loadResourcePassagePage(bible:BibleResource,range:ResourceRange,cursor:ResourceChapter,wholeChapter=false):Promise<{ref:PassageReference;verses:VerseData[]}> {
 if(!inRange(range,cursor))throw Error('The requested chapter is outside the source reference range.');
 const exists=(point:ResourceChapter):boolean=>Number.isInteger(point.book)&&point.book>=1&&point.book<=66&&Number.isInteger(point.chapter)&&point.chapter>=1&&point.chapter<=bible.getChapterCount(BOOKS[point.book-1]);
 if(!exists(range.start)||range.end&&!exists(range.end)||!exists(cursor))throw Error('This source chapter is unavailable in the selected Bible edition. No passage was substituted.');
 const book=BOOKS[cursor.book-1];
 const first=order(cursor)===order(range.start)?range.start.verse:undefined;
 const end=range.end??range.start;
 const last=order(cursor)===order(end)?end.verse:undefined;
 const chapter=await bible.getChapter({book,chapter:cursor.chapter});
 if(first!==undefined&&!chapter.verses.some(verse=>verse.verse===first)||last!==undefined&&!chapter.verses.some(verse=>verse.verse===last))throw Error('This source coordinate is unavailable in the selected Bible edition. No verse was substituted.');
 const ref:PassageReference={book,chapter:cursor.chapter,...(first!==undefined?{verse:first}:{})};
 if(last!==undefined){ref.verse=first??chapter.verses[0]?.verse;if(ref.verse!==last)ref.endVerse=last;}
 const verses=wholeChapter?chapter.verses:chapter.verses.filter(verse=>(first===undefined||verse.verse>=first)&&(last===undefined||verse.verse<=last));
 if(!verses.length||verses.length>200||verses.some((verse,index)=>index>0&&verse.verse!==verses[index-1].verse+1))throw Error('No complete source passage is available at these coordinates.');
 return {ref,verses};
}
export function resourceAdjacentChapter(bible:BibleResource,range:ResourceRange,current:ResourceChapter,direction:1|-1):ResourceChapter|null {
 let book=current.book,chapter=current.chapter+direction;
 if(direction===1&&chapter>bible.getChapterCount(BOOKS[book-1])){book++;chapter=1;}
 if(direction===-1&&chapter<1){book--;chapter=book>0?bible.getChapterCount(BOOKS[book-1]):0;}
 const cursor={book,chapter};return inRange(range,cursor)?cursor:null;
}
