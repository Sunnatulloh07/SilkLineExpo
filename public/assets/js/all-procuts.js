try {
  const ITEMS_PER_PAGE = 8;

  document.addEventListener("DOMContentLoaded", () => {
    const companyCategories = document.getElementById("company-categories");
    const productTabs = document.querySelector(".products-tab");
    const productContainer = document.querySelector(".list-grid-wrapper");
    const paginationContainer = document.querySelector(".common-pagination");

    if (!companyCategories || !productTabs || !productContainer || !paginationContainer) {
      console.error("Required DOM elements not found");
      return;
    }

    fetch("data.json")
      .then((response) => {
        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
        return response.json();
      })
      .then((data) => {
        const allCompanies = data.countries.flatMap((country) => country.companies);
        initializeProductSystem(allCompanies);
      })
      .catch((error) => {
        console.error("Error loading data:", error);
        productContainer.innerHTML =
          '<div class="alert alert-danger">Failed to load products. Please try again later.</div>';
      });

    function initializeProductSystem(companies) {
      renderCompanySidebar(companies);
      const defaultCompany = companies[0];
      const defaultTypes = [...new Set(defaultCompany.products.map((p) => p.type))];

      renderTabs(defaultTypes);
      displayProducts(defaultCompany.products, 1, defaultCompany.name);
      productTabs.querySelector('.nav-link[data-type="all"]').classList.add("active");

      attachTabListeners(defaultCompany);
      attachCompanyListeners(companies);
    }

    function renderCompanySidebar(companies) {
      companyCategories.innerHTML = "";
      companies.forEach((company, index) => {
        const isActive = index === 0 ? "active" : "";
        companyCategories.innerHTML += `
          <li class="filter-sidebar-list__item cursor-pointer d-flex align-items-center justify-content-between ${isActive}" data-company="${company.name}">
            ${company.name} <span class="qty">${company.products.length}</span>
          </li>`;
      });
    }

    function renderTabs(types) {
      productTabs.innerHTML = `
        <li class="nav-item" role="presentation">
          <button class="nav-link" data-type="all" type="button">All Item</button>
        </li>`;
      types.forEach((type) => {

        productTabs.innerHTML += `
          <li class="nav-item" role="presentation">
            <button class="nav-link" data-type="${type}" type="button">${type}</button>
          </li>`;
      });
    }

    function attachCompanyListeners(companies) {

      document.querySelectorAll(".filter-sidebar-list__item").forEach((item) => {
        item.addEventListener("click", () => {
          document.querySelectorAll(".filter-sidebar-list__item").forEach((el) => el.classList.remove("active"));
          item.classList.add("active");

          const selectedCompanyName = item.dataset.company;
          const selectedCompany = companies.find((c) => c.name === selectedCompanyName);

          if (!selectedCompany) return;

          const types = [...new Set(selectedCompany.products.map((p) => p.type))];
          renderTabs(types);
          displayProducts(selectedCompany.products, 1, selectedCompany.name);
          productTabs.querySelector('.nav-link[data-type="all"]').classList.add("active");
          attachTabListeners(selectedCompany);
        });
      });
    }

    function attachTabListeners(company) {
      const allTabs = productTabs.querySelectorAll(".nav-link");
      allTabs.forEach((tab) => {
        const newTab = tab.cloneNode(true);
        tab.parentNode.replaceChild(newTab, tab);
      });

      const updatedTabs = productTabs.querySelectorAll(".nav-link");
      updatedTabs.forEach((tab) => {
        tab.addEventListener("click", () => {
          updatedTabs.forEach((t) => t.classList.remove("active"));
          tab.classList.add("active");

          const type = tab.dataset.type;
          const filtered = type === "all" ? company.products : company.products.filter((p) => p.type === type);
          displayProducts(filtered, 1, company.name);
        });
      });
    }

    function displayProducts(products, page, companyName = "") {
      const start = (page - 1) * ITEMS_PER_PAGE;
      const end = start + ITEMS_PER_PAGE;
      const paginatedProducts = products.slice(start, end);

      productContainer.innerHTML = "";
      if (paginatedProducts.length === 0) {
        productContainer.innerHTML = '<div class="alert alert-info text-center">No products found.</div>';
        return;
      }

      const companySlug = toSlug(companyName);

      paginatedProducts.forEach((product) => {
        const productUrl = `product-details.html?company=${companySlug}&id=${product.id}`;
        productContainer.innerHTML += `
          <div class="col-xl-4 col-sm-6">
            <div class="product-item section-bg">
              <div class="product-item__thumb d-flex">
                <a href="${productUrl}" class="link w-100">
                  <img src="${product.image}" alt="${product.title}" class="cover-img">
                </a>
              </div>
              <div class="product-item__content">
                <h6 class="product-item__title">
                  <a href="${productUrl}" class="link">${product.title}</a>
                </h6>
                <div class="product-item__info flx-between gap-2">
                  <span class="product-item__author">
                    by <a href="#!" class="link hover-text-decoration-underline">${product.type}</a>
                  </span>
                  <div class="flx-align gap-2">
                    <h6 class="product-item__price mb-0">$${product.price}</h6>
                  </div>
                </div>
                <div class="product-item__bottom flx-between gap-2">
                  <a href="${productUrl}" class="btn btn-outline-light btn-sm pill">See more</a>
                </div>
              </div>
            </div>
          </div>`;
      });

      renderBootstrapPagination(products.length, page, companyName);
    }

    function renderBootstrapPagination(totalItems, currentPage, companyName) {
      const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
      paginationContainer.innerHTML = "";
      if (totalPages <= 1) return;

      paginationContainer.innerHTML = `
        <nav aria-label="Page navigation">
          <ul class="pagination justify-content-center">
            <li class="page-item ${currentPage === 1 ? "disabled" : ""}">
              <a class="page-link" href="#" data-page="${currentPage - 1}" aria-label="Previous">
                <span aria-hidden="true">&laquo;</span>
              </a>
            </li>`;

      for (let i = 1; i <= totalPages; i++) {
        paginationContainer.innerHTML += `
            <li class="page-item ${i === currentPage ? "active" : ""}">
              <a class="page-link" href="#" data-page="${i}">${i}</a>
            </li>`;
      }

      paginationContainer.innerHTML += `
            <li class="page-item ${currentPage === totalPages ? "disabled" : ""}">
              <a class="page-link" href="#" data-page="${currentPage + 1}" aria-label="Next">
                <span aria-hidden="true">&raquo;</span>
              </a>
            </li>
          </ul>
        </nav>`;

      attachPaginationListeners(companyName);
    }

    function attachPaginationListeners(companyName) {
      paginationContainer.querySelectorAll(".page-link").forEach((link) => {
        link.addEventListener("click", (e) => {
          e.preventDefault();
          const pageElement = e.target.closest(".page-link");
          if (!pageElement) return;

          const page = Number.parseInt(pageElement.dataset.page);
          if (isNaN(page)) return;

          const selectedCompanyElement = document.querySelector(".filter-sidebar-list__item.active");
          if (!selectedCompanyElement) return;

          const selectedCompanyName = selectedCompanyElement.dataset.company;
          const activeTabElement = productTabs.querySelector(".nav-link.active");
          if (!activeTabElement) return;

          const type = activeTabElement.dataset.type;

          fetch("data.json")
            .then((response) => response.json())
            .then((data) => {
              const allCompanies = data.countries.flatMap((country) => country.companies);
              const selectedCompany = allCompanies.find((c) => c.name === selectedCompanyName);
              
              if (!selectedCompany) return;

              const filtered =
                type === "all"
                  ? selectedCompany.products
                  : selectedCompany.products.filter((p) => p.type === type);

              displayProducts(filtered, page, selectedCompany.name);
            })
            .catch((error) => console.error("Error loading data for pagination:", error));
        });
      });
    }

    function toSlug(str) {
      return str
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9\-]/g, "")
        .trim();
    }
  });
} catch (error) {
  console.error(error);
}
