'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useInView } from 'motion/react';
import Icon from './iconbuddy-icon';

const number = value => String(value + 1).padStart(2, '0');
function CardContent({ project, index, active }) {
  return <>
    <div className="orbit-card-top"><span className="project-number">{number(index)} / PROJECT</span><span className="orbit-card-status">{active ? 'IN FOCUS' : 'EXPLORE'}</span></div>
    <div className="project-image"><img src={project.previewImage} alt={`${project.name} preview`} width="900" height="600" loading="lazy" draggable="false"/><span className="project-open"><Icon name="arrow-up-right"/></span></div>
    <h3>{project.name}<span><Icon name="arrow-up-right"/></span></h3>
    <p>{project.shortDescription}</p>
    <span className="project-tags">{project.tags.join('  /  ')}</span>
  </>;
}
export default function ProjectCarousel({ projects }) {
  const [active, setActive] = useState(0);
  const region = useRef(null);
  const activeCard = useRef(null);
  const [stageHeight, setStageHeight] = useState(620);
  useEffect(() => {
    const card=activeCard.current;
    if(!card)return;
    const observer=new ResizeObserver(([entry])=>setStageHeight(Math.ceil(entry.contentRect.height)+65));
    observer.observe(card);
    return()=>observer.disconnect();
  },[active,projects.length]);
  const visible = useInView(region, { amount: .1 });
  const gesture = useRef(null);
  const suppressClick = useRef(false);
  const count = projects.length;
  const go = index => setActive((index % count + count) % count);
  if (!count) return null;
  const onPointerDown = event => {
    if (event.button !== 0 || event.target.closest('button')) return;
    gesture.current={ x:event.clientX, y:event.clientY, dragging:false };
    suppressClick.current=false;
  };
  const onPointerMove = event => {
    const start=gesture.current;
    if(!start)return;
    const dx=event.clientX-start.x,dy=event.clientY-start.y;
    if(Math.abs(dx)>12 && Math.abs(dx)>Math.abs(dy)*1.3){
      start.dragging=true;
      event.currentTarget.setPointerCapture(event.pointerId);
    }
  };
  const onPointerUp = event => {
    const start=gesture.current;
    gesture.current=null;
    if(!start?.dragging)return;
    suppressClick.current=true;
    if(Math.abs(event.clientX-start.x)>45)go(active+(event.clientX<start.x?1:-1));
    if(event.currentTarget.hasPointerCapture(event.pointerId))event.currentTarget.releasePointerCapture(event.pointerId);
  };
  return <div ref={region} className={`project-carousel${visible ? ' is-in-view' : ''}`} role="region" aria-roledescription="carousel" aria-label="Selected projects" tabIndex={0}
    onKeyDown={event=>{
      if(event.key==='ArrowRight'){event.preventDefault();go(active+1)}
      if(event.key==='ArrowLeft'){event.preventDefault();go(active-1)}
      if(event.key==='Home'){event.preventDefault();go(0)}
      if(event.key==='End'){event.preventDefault();go(count-1)}
    }}>
    <div className="orbit-heading"><h2>Projects in orbit<span>.</span></h2><span className="orbit-hint">SWIPE OR USE THE ARROWS</span></div>
    <div className="orbit-stage" style={{height:stageHeight}} onDragStart={event=>event.preventDefault()} onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp} onPointerCancel={()=>{gesture.current=null}}
      onClickCapture={event=>{if(suppressClick.current){event.preventDefault();event.stopPropagation();suppressClick.current=false}}}>
      <div className="orbit-rings" aria-hidden="true"><i/><i/></div>
      {projects.map((project,index)=>{
        let slot=(index-active+count)%count;
        if(slot>count/2)slot-=count;
        const focused=index===active;
        const hidden=Math.abs(slot)>1;
        return <div key={project.slug} className={`orbit-slide${focused ? ' is-active' : ''}`} role="group" aria-roledescription="slide" aria-label={`${index+1} of ${count}: ${project.name}`} aria-hidden={hidden || undefined}
          style={{'--slot':slot,'--card-scale':focused?1:.78,opacity:hidden?0:focused?1:.48,zIndex:focused?3:1,pointerEvents:hidden?'none':'auto'}}>
          <div className="orbit-float" ref={focused ? activeCard : undefined}>
            {focused ? <Link draggable={false} className="project-card" href={`/project/${project.slug}/`}><CardContent project={project} index={index} active/></Link>
              : <button type="button" className="orbit-preview-button" tabIndex={hidden?-1:0} aria-label={`Show ${project.name}`} onClick={()=>go(index)}><span className="project-card" aria-hidden="true"><CardContent project={project} index={index}/></span></button>}
          </div>
        </div>;
      })}
    </div>
    <div className="orbit-controls">
      <span className="orbit-count" aria-hidden="true"><b>{number(active)}</b><span>/ {String(count).padStart(2,'0')}</span></span>
      <div className="orbit-dots" role="group" aria-label="Choose a project">{projects.map((project,index)=><button key={project.slug} type="button" className={active===index?'active':''} aria-label={`Show ${project.name}`} aria-pressed={active===index} onClick={()=>go(index)}><span/></button>)}</div>
      <div className="orbit-arrows"><button type="button" aria-label="Previous project" disabled={count<2} onClick={()=>go(active-1)}><Icon name="arrow-up-right" className="orbit-previous"/></button><button type="button" aria-label="Next project" disabled={count<2} onClick={()=>go(active+1)}><Icon name="arrow-up-right" className="orbit-next"/></button></div>
    </div>
    <p className="sr-only" aria-live="polite" aria-atomic="true">Project {active+1} of {count}: {projects[active].name}</p>
  </div>;
}
