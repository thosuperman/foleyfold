import { paintIcons } from './icons.ts';
export function el<T extends HTMLElement=HTMLElement>(id:string):T {return document.getElementById(id) as T;}
export function setText(id:string,value:string){const target=el(id);if(target.textContent!==value)target.textContent=value;}
export function listen(id:string,fn:()=>void){el(id).addEventListener('click',fn);}
let timer:ReturnType<typeof setTimeout>;
export function toast(msg:string){setText('toast',msg);clearTimeout(timer);timer=setTimeout(()=>setText('toast',''),3600);}
export const modal=()=>el<HTMLDialogElement>('modal');
export function dialog(title:string,markup:string){
 setText('dlgTitle',title);el('dlgBody').innerHTML=markup;paintIcons(el('dlgBody'));
 modal().setAttribute('aria-labelledby','dlgTitle');
 if(!modal().open) modal().showModal();
}
export const btn=(id:string,label:string)=>'<button type="button" class="btn dark" id="'+id+'">'+label+'</button>';
