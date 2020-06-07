const DeleteButton = (btn)=>{
  const id = btn.parentNode.querySelector('[name=productId]').value;
  const csrf = btn.parentNode.querySelector('[name=_csrf]').value;
  console.log(id+"\n"+csrf);

  const productElement = btn.closest('article');

  fetch("/admin/product/"+id,{
    method:'DELETE',
    headers:{
      'csrf-token':csrf
    }
  })
  .then(result=>{
    console.log(result);
  })
  .then(data=>{
    console.log(data);
    productElement.parentNode.removeChild(productElement);
  })
  .catch(err=>{
    console.log(err);
  })
};
