export const siteDocCategories = [
  {id:'site-swms', label:'SWMS', title:'Safe Work Method Statements', description:'Upload SWMS for the work being carried out on this project.'},
  {id:'site-prestart', label:'Pre-start Meetings', title:'Pre-start meetings', description:'Keep meeting records, toolbox talks and attendance sheets together.'},
  {id:'site-permits', label:'Permits', title:'Permits', description:'Upload hot works permits and other permits required for this site.'},
  {id:'site-msds', label:'MSDS', title:'Material Safety Data Sheets', description:'Keep safety data sheets for materials and chemicals used on site.'},
  {id:'site-ohs', label:'OHS Policy', title:'Occupational Health and Safety Policy', description:'Upload company OHS policies and site safety procedures.'},
] as const;
export const isSiteDocCategory = (value:string) => siteDocCategories.some(category=>category.id===value);
