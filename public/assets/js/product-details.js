function getParamsFromUrl() {
  const params = new URLSearchParams(window.location.search);
  return {
    productId: parseInt(params.get("id")),
    companyParam: params.get("company")?.trim().toLowerCase()
  };
}

document.addEventListener("DOMContentLoaded", () => {
  const { productId, companyParam } = getParamsFromUrl();
  const productDetailsContainer = document.querySelector(".product-details");

  // Exit early if required elements don't exist on this page
  if (!productDetailsContainer) {
    console.log('Product-details script: Required elements not found on this page');
    return;
  }

  if (!productId || !companyParam) {
    productDetailsContainer.innerHTML = "<p>Mahsulot yoki kompaniya topilmadi</p>";
    return;
  }

  fetch("data.json")
    .then(res => res.json())
    .then(data => {
      let foundProduct = null;
      let foundCompany = null;

      data.countries.forEach(country => {
        country.companies.forEach(company => {
          const normalizedCompany = company.name.trim().toLowerCase();

          if (normalizedCompany === companyParam) {
            const product = company.products.find(p => p.id === productId);
            if (product) {
              foundProduct = product;
              foundCompany = company;
            }
          }
        });
      });

      if (foundProduct && foundCompany) {
        // Title
        const titleEl = document.getElementById("product-title");
        if (titleEl) titleEl.textContent = foundProduct.title;

        // Company
        const companyEl = document.getElementById("product-company");
        if (companyEl) {
          companyEl.innerHTML = `
            <span class="text">By <a href="#" class="link text-main fw-600">${foundCompany.name}</a></span>
          `;
        }

        // Sales
        const salesEl = document.getElementById("product-sales");
        if (salesEl) {
          salesEl.innerHTML = `
            <span class="icon">
              <img src="assets/images/icons/cart-icon.svg" alt="" class="white-version">
              <img src="assets/images/icons/cart-white.svg" alt="" class="dark-version w-20">
            </span>
            <span class="text">${foundProduct.sales || 0} sales</span>
          `;
        }

        // Image
        const imgEl = document.getElementById("product-image");
        if (imgEl) imgEl.src = foundProduct.image;

        // Description
        const descEl = document.getElementById("product-description");
        if (descEl) descEl.textContent = foundProduct.description || "Tavsif mavjud emas";

      } else {
        const wrapper = document.querySelector(".product-details");
        if (wrapper) wrapper.innerHTML = "<p>Mahsulot topilmadi</p>";
      }
    })
    .catch(err => {
      console.error("Xatolik:", err);
      const wrapper = document.querySelector(".product-details");
      if (wrapper) wrapper.innerHTML = "<p>Xatolik yuz berdi</p>";
    });
});
