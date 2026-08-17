
(function(){
  'use strict';

  function starter(kind){
    var brand=(state.globalHeader&&state.globalHeader.logo)||state.projectName||'this studio';
    switch(kind){
      case 'Stats': return {name:'Stats',copy:'The numbers behind the work.',block:{
        kind:'metrics',eyebrow:'Stats',items:[
          {k:'Projects',v:'48',sub:'delivered'},
          {k:'On time',v:'94%',sub:'to agreed date'},
          {k:'Repeat',v:'71%',sub:'come back'},
          {k:'Team',v:'9',sub:'in house'}]}};
      case 'Pricing': return {name:'Pricing',copy:'What it costs, before you ask.',block:{
        kind:'pricing',eyebrow:'Pricing',plans:[
          {name:'Starter',amt:'49',per:'month',items:['One project','Email support','Monthly review']},
          {name:'Studio',amt:'149',per:'month',items:['Five projects','Priority support','Weekly review','Custom domain']},
          {name:'Scale',amt:'399',per:'month',items:['Unlimited projects','Named contact','Same-day replies','Onboarding']}]}};
      case 'FAQ': return {name:'FAQ',copy:'Asked before almost every start.',block:{
        kind:'faq',eyebrow:'FAQ',items:[
          {q:'How long does it take?',a:'Most projects run two to four weeks from brief to launch.'},
          {q:'What do you need from me?',a:'A short brief, your logo if you have one, and one decision maker.'},
          {q:'Can I change it later?',a:'Yes. Everything stays editable after launch.'},
          {q:'What does it cost?',a:'See the plans above, or ask for a fixed quote.'}]}};
      case 'Gallery': return {name:'Gallery',copy:'Selected work, newest first.',block:{
        kind:'gallery',eyebrow:'Gallery',tiles:['Recent one','Recent two','Recent three','Recent four','Recent five','Recent six']}};
      case 'Features': return {name:'Features',copy:'How it works, in four steps.',block:{
        kind:'split',eyebrow:'Features',bullets:[
          'Tell us what you need in a sentence',
          'See a working draft the same day',
          'Change anything by typing on it',
          'Publish when it reads right']}};
      case 'Timeline': return {name:'Process',copy:'From brief to live.',block:{
        kind:'timeline',eyebrow:'Process',steps:[
          {when:'WEEK 01',title:'Brief',copy:'One conversation to agree what this has to do.'},
          {when:'WEEK 02',title:'Draft',copy:'A working version you can click through.'},
          {when:'WEEK 03',title:'Launch',copy:'Live on your address, with you holding the keys.'}]}};
      case 'Logos': return {name:'Clients',copy:'Who we have worked with.',block:{
        kind:'logos',eyebrow:'Clients',names:['NORTHWIND','ORBIT','KESTREL','MERIDIAN','ATLAS','LUMEN']}};
      case 'Quote': return {name:'Testimonial',copy:'In their words.',block:{
        kind:'quote',eyebrow:'Testimonial',
        quote:'They shipped in three weeks what we had been circling for a year.',
        attr:'A client of '+brand}};
      case 'CTA': return {name:'Get in touch',copy:'Tell us what you need and we will reply the same day.',block:null};
      default: return null;
    }
  }

  function pushSection(spec){
    recordUndo();
    state.components=state.components||[];
    state.sectionCopy=state.sectionCopy||[];
    state.components.push(spec.name);
    state.sectionCopy.push(spec.copy);
    // templateSections is positional, so it has to stay the same length
    if(spec.block||Array.isArray(state.templateSections)){
      var blocks=Array.isArray(state.templateSections)?state.templateSections.slice():[];
      while(blocks.length<state.components.length-1)blocks.push(null);
      blocks.push(spec.block||null);
      state.templateSections=blocks;
    }
    state.selected='component:'+(state.components.length-1);
    makeVersion(spec.name+' added');
    saveState();
    render('builder');
  }

  document.addEventListener('click',function(e){
    var b=e.target.closest('[data-action="addComponent"]');
    if(!b)return;
    var name=b.dataset.component||'';

    // these are not sections at all, so the old handler must not run
    if(name==='Hero'){
      e.preventDefault();e.stopImmediatePropagation();
      state.selected='hero';saveState();render('builder');
      toast('Hero selected — edit it on the canvas or in the inspector');
      return;
    }
    if(name==='3D Scene'){
      e.preventDefault();e.stopImmediatePropagation();
      if(window.__openSceneEditor)window.__openSceneEditor();
      else toast('Scene editor is not available here');
      return;
    }
    if(name==='Navbar'){
      e.preventDefault();e.stopImmediatePropagation();
      state.globalHeader.enabled=!state.globalHeader.enabled;
      saveState();render('builder');
      toast(state.globalHeader.enabled?'Navigation shown':'Navigation hidden');
      return;
    }
    if(name==='Footer'){
      e.preventDefault();e.stopImmediatePropagation();
      state.globalFooter.enabled=!state.globalFooter.enabled;
      saveState();render('builder');
      toast(state.globalFooter.enabled?'Footer shown':'Footer hidden');
      return;
    }
    if(name==='Video'){
      e.preventDefault();e.stopImmediatePropagation();
      if(state.heroVideoAssetId){toast('A video is already behind the headline');return}
      state.builderTab='media';saveState();render('builder');
      toast('Pick a video from your media');
      return;
    }

    var spec=starter(name);
    if(!spec)return;                     // Form and CMS Grid keep their own handlers
    e.preventDefault();e.stopImmediatePropagation();
    pushSection(spec);
    toast(spec.name+' added — click the text to edit it');
  },true);

  // more block types than the old grid offered
  var basePanel=window.builderPanel;
  window.builderPanel=function(){
    var html=basePanel.apply(this,arguments);
    if(state.builderTab!=='components'||typeof html!=='string')return html;
    var extra=['Timeline','Logos','Quote'].map(function(x){
      return '<button class="component" data-action="addComponent" data-component="'+x+'">'+x+'</button>';
    }).join('');
    // append inside the grid, which is the last div in the panel — replacing
    // the first one would drop them into the tip line above it
    var at=html.lastIndexOf('</div>');
    return at<0?html:html.slice(0,at)+extra+html.slice(at);
  };
})();
