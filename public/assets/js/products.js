document.addEventListener('DOMContentLoaded', () => {
  let ITEMS_PER_PAGE = 8;

  const tabsContainer = document.getElementById('pills-tab');
  const tabContent = document.getElementById('pills-tabContent');

  initProductDisplay();

  async function initProductDisplay() {
    try {
      const allProducts = await fetchAllProducts();
      const productTypes = getUniqueProductTypes(allProducts);

      renderProductTabs(productTypes);
      renderTabContent(allProducts, productTypes);
      setupPaginationListeners(allProducts, productTypes);
      setupItemsPerPageConfig();
    } catch (error) {
      console.error('Error initializing product display:', error);
      showErrorMessage();
    }
  }

  async function fetchAllProducts() {
    const response = await fetch('data.json');
    if (!response.ok) throw new Error('Failed to fetch data');
    const data = await response.json();
    if (!data.countries) throw new Error('Invalid data format');

    return data.countries.flatMap(country =>
      country.companies.flatMap(company =>
        company.products.map(product => ({
          ...product,
          company: company.name,
          country: country.name
        }))
      )
    );
  }

  function getUniqueProductTypes(products) {
    const types = new Set(products.map(p => p.type));
    return ['All', ...Array.from(types)];
  }

  function renderProductTabs(types) {
    tabsContainer.innerHTML = '';
    types.forEach((type, index) => {
      const isActive = index === 0 ? 'active' : '';
      const typeId = type === 'All' ? 'all' : type.toLowerCase().replace(/\s+/g, '-');
      const tabItem = document.createElement('li');
      tabItem.className = 'nav-item';
      tabItem.setAttribute('role', 'presentation');
      tabItem.innerHTML = `
        <button class="nav-link ${isActive}" id="pills-${typeId}-tab" data-bs-toggle="pill" data-bs-target="#pills-${typeId}" type="button" role="tab" aria-controls="pills-${typeId}" aria-selected="${index === 0 ? 'true' : 'false'}" data-type="${type}">
          ${type}
        </button>`;
      tabsContainer.appendChild(tabItem);
    });
  }

  // function renderTabContent(allProducts, types) {
  //   tabContent.innerHTML = '';
  //   types.forEach((type, index) => {
  //     const isActive = index === 0 ? 'show active' : '';
  //     const typeId = type === 'All' ? 'all' : type.toLowerCase().replace(/\s+/g, '-');
  //     const filteredProducts = type === 'All' ? allProducts : allProducts.filter(p => p.type === type);
  //     const tabPane = document.createElement('div');
  //     tabPane.className = `tab-pane fade ${isActive}`;
  //     tabPane.id = `pills-${typeId}`;
  //     tabPane.setAttribute('role', 'tabpanel');
  //     tabPane.setAttribute('aria-labelledby', `pills-${typeId}-tab`);
  //     tabPane.setAttribute('tabindex', '0');
  //     tabPane.setAttribute('data-type', type);

  //     renderProductsForTab(tabPane, filteredProducts, 1);
  //     tabContent.appendChild(tabPane);
  //   });
  // }

  function renderTabContent(allProducts, types) {
  tabContent.innerHTML = '';
  types.forEach((type, index) => {
    const isActive = index === 0 ? 'show active' : '';
    const typeId = type === 'All' ? 'all' : type.toLowerCase().replace(/\s+/g, '-');

    // Har bir type uchun filtered va shuffled products
    let filteredProducts = type === 'All'
      ? allProducts
      : allProducts.filter(p => p.type === type);

    // Har bir turdagi mahsulotlar o'z ichida random tartibda bo'lishi kerak
    filteredProducts = shuffleArray(filteredProducts);

    const tabPane = document.createElement('div');
    tabPane.className = `tab-pane fade ${isActive}`;
    tabPane.id = `pills-${typeId}`;
    tabPane.setAttribute('role', 'tabpanel');
    tabPane.setAttribute('aria-labelledby', `pills-${typeId}-tab`);
    tabPane.setAttribute('tabindex', '0');
    tabPane.setAttribute('data-type', type);

    renderProductsForTab(tabPane, filteredProducts, 1);
    tabContent.appendChild(tabPane);
  });
}

  function shuffleArray(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}


  function renderProductsForTab(tabPane, products, page) {
    if (tabPane.getAttribute('data-type') === 'All') {
      products = shuffleArray(products);
    }

    const start = (page - 1) * ITEMS_PER_PAGE;
    const end = start + ITEMS_PER_PAGE;
    const paginatedProducts = products.slice(start, end);
    const productsContainer = document.createElement('div');
    productsContainer.className = 'row gy-4';

    if (paginatedProducts.length === 0) {
      productsContainer.innerHTML = `<div class="col-12"><div class="alert alert-info text-center">No products found.</div></div>`;
    } else {
      paginatedProducts.forEach(product => {
        productsContainer.innerHTML += generateProductCard(product);
      });
    }

    tabPane.innerHTML = '';
    tabPane.appendChild(productsContainer);

    if (products.length > ITEMS_PER_PAGE) {
      const paginationElement = generatePagination(products.length, page, tabPane.getAttribute('data-type'));
      tabPane.appendChild(paginationElement);
    }
  }
  // Slug yasovchi funksiya
  function toSlug(str) {
    return str
      .toLowerCase()
      .replace(/\s+/g, '-')    // probel → -
      .replace(/[^a-z0-9\-]/g, '') // boshqa belgilarni olib tashlaydi
      .trim();
  }

  // Mahsulot kartasi yasovchi funksiya
  function generateProductCard(product) {

    // Company nomini slug holatga keltiramiz
    const companySlug = toSlug(product.company);

    // URL uchun umumiy link
    const productUrl = `product-details.html?company=${companySlug}&id=${product.id}`;

    return `
    <div class="col-12 col-sm-12 col-md-6 col-lg-4 col-xl-3">
      <div class="product-item">
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
              by <a href="#" class="link hover-text-decoration-underline">${product.company}</a>
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
  }

  function generatePagination(totalItems, currentPage, type) {
    const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
    const paginationNav = document.createElement('nav');
    paginationNav.setAttribute('aria-label', 'Page navigation');
    paginationNav.className = 'mt-5';

    const paginationList = document.createElement('ul');
    paginationList.className = 'pagination justify-content-center';

    paginationList.innerHTML = `
      <li class="page-item ${currentPage === 1 ? 'disabled' : ''}">
        <a class="page-link" href="#" data-page="${currentPage - 1}" data-type="${type}" aria-label="Previous">
          <span aria-hidden="true">&laquo;</span>
        </a>
      </li>`;

    for (let i = 1; i <= totalPages; i++) {
      paginationList.innerHTML += `
        <li class="page-item ${i === currentPage ? 'active' : ''}">
          <a class="page-link" href="#" data-page="${i}" data-type="${type}">${i}</a>
        </li>`;
    }

    paginationList.innerHTML += `
      <li class="page-item ${currentPage === totalPages ? 'disabled' : ''}">
        <a class="page-link" href="#" data-page="${currentPage + 1}" data-type="${type}" aria-label="Next">
          <span aria-hidden="true">&raquo;</span>
        </a>
      </li>`;

    paginationNav.appendChild(paginationList);
    return paginationNav;
  }

  function setupPaginationListeners(allProducts) {
    tabContent.addEventListener('click', (event) => {
      const pageLink = event.target.closest('.page-link');
      if (!pageLink) return;
      event.preventDefault();

      const page = parseInt(pageLink.getAttribute('data-page'));
      const type = pageLink.getAttribute('data-type');
      if (isNaN(page)) return;

      const typeId = type === 'All' ? 'all' : type.toLowerCase().replace(/\s+/g, '-');
      const tabPane = document.getElementById(`pills-${typeId}`);
      if (!tabPane) return;

      const filteredProducts = type === 'All'
        ? allProducts
        : allProducts.filter(p => p.type === type);

      renderProductsForTab(tabPane, filteredProducts, page);
      tabPane.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }

  function setupItemsPerPageConfig() {
    window.setItemsPerPage = function (count) {
      if (typeof count === 'number' && count > 0) {
        ITEMS_PER_PAGE = count;
        initProductDisplay();
      } else {
        console.error('Invalid items per page count. Must be a positive number.');
      }
    };
  }

  function showErrorMessage() {
    tabContent.innerHTML = `<div class="alert alert-danger">Failed to load products. Try again later.</div>`;
  }
});
