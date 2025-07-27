document.addEventListener('DOMContentLoaded', async () => {
  const profileContainer = document.getElementById('company-profile');
  const detailsContainer = document.getElementById('company-details');
  const tabsContainer = document.getElementById('pills-tab');
  const tabContentContainer = document.getElementById('pills-tabContent');
  
  // Exit early if required elements don't exist on this page
  if (!profileContainer || !detailsContainer || !tabsContainer || !tabContentContainer) {
    console.log('About-company script: Required elements not found on this page');
    return;
  }
  
  const urlParams = new URLSearchParams(window.location.search);
  const companyName = urlParams.get('company-name');

  function generateProductUrl(companyName, productId) {
    const companySlug = toSlug(companyName);
    return `product-details.html?company=${companySlug}&id=${productId}`;
  }


  if (!companyName) {
    profileContainer.innerHTML = `<div class="text-danger">Company not found.</div>`;
    return;
  }

  try {
    const data = await fetchData();
    const allCompanies = data.countries.flatMap(c => c.companies);
    const company = allCompanies.find(c => c.name.toLowerCase() === companyName.toLowerCase());

    if (!company) {
      profileContainer.innerHTML = `<div class="text-warning">No company found with name: ${companyName}</div>`;
      return;
    }

    renderCompanyProfile(company);
    renderCompanyDetails(company);
    if (company.products && tabsContainer && tabContentContainer) {
      renderProductTabs(company.products);
      renderProductContent(company.products, company.name);
    }

  } catch (error) {
    console.error(error);
    profileContainer.innerHTML = `<div class="text-danger">Error loading company data.</div>`;
  }

  // 🔁 Fetch JSON
  async function fetchData() {
    const res = await fetch('data.json');
    if (!res.ok) throw new Error('Failed to fetch data.json');
    return await res.json();
  }

  // 🧩 Render profile section
  function renderCompanyProfile(company) {
    profileContainer.innerHTML = `
      <div class="author-profile__thumb flex-shrink-0">
        <img src="${company.img}" alt="${company.name}">
      </div>
      <div class="d-flex align-items-end flex-wrap gap-4">
        <div class="author-profile__info">
          <h5 class="author-profile__name mb-2">${company.name}</h5>
          <span class="author-profile__membership font-14">Qo‘shilgan sana: ${company.dateAdded}</span>
        </div>
      </div>
    `;
  }

  // ℹ️ Render about section
  function renderCompanyDetails(company) {
    if (!detailsContainer) return;
    detailsContainer.innerHTML = `
      <div class="profile-content__thumb mb-lg-5 mb-4">
        <img src="${company.img}" alt="${company.name}">
      </div>
      <div class="profile-content__item-wrapper">
        <div class="profile-content__item">
          <h5 class="profile-content__title mb-2">About us</h5>
          <p class="profile-content__desc">${company["company-info"]}</p>
        </div>
      </div>
    `;
  }

  // 📌 Render product type tabs
  function renderProductTabs(products) {
    const uniqueTypes = [...new Set(products.map(p => p.type))];
    tabsContainer.innerHTML = `
      <li class="nav-item" role="presentation">
        <button class="nav-link active" id="pills-all-tab" data-bs-toggle="pill"
          data-bs-target="#pills-all" type="button" role="tab"
          aria-controls="pills-all" aria-selected="true">
          All Item
        </button>
      </li>
    `;

    uniqueTypes.forEach((type) => {
      const typeId = `pills-${toSlug(type)}`;
      tabsContainer.innerHTML += `
        <li class="nav-item" role="presentation">
          <button class="nav-link" id="${typeId}-tab" data-bs-toggle="pill"
            data-bs-target="#${typeId}" type="button" role="tab"
            aria-controls="${typeId}" aria-selected="false">
            ${type}
          </button>
        </li>`;
    });
  }

  // 🧱 Render product cards by type
  function renderProductContent(products, companyName) {
    tabContentContainer.innerHTML = '';
    const pageSize = 8;
    const allPaginated = paginate(products, pageSize);

    // All
    const allDiv = createTabPane('pills-all', true);
    const allRow = document.createElement('div');
    allRow.className = 'row gy-4 list-grid-wrapper';
    renderProductCards(allRow, allPaginated[0], companyName); // 👈 companyName passed
    allDiv.appendChild(allRow);
    if (products.length > pageSize) {
      allDiv.appendChild(createPagination(allPaginated, allRow, companyName));
    }
    tabContentContainer.appendChild(allDiv);

    // Grouped by type
    const grouped = {};
    products.forEach(p => {
      if (!grouped[p.type]) grouped[p.type] = [];
      grouped[p.type].push(p);
    });

    for (const [type, items] of Object.entries(grouped)) {
      const typeId = `pills-${toSlug(type)}`;
      const contentDiv = createTabPane(typeId, false);
      const row = document.createElement('div');
      row.className = 'row gy-4 list-grid-wrapper';

      const paginated = paginate(items, pageSize);
      renderProductCards(row, paginated[0], companyName); // 👈 companyName passed
      contentDiv.appendChild(row);
      if (items.length > pageSize) {
        contentDiv.appendChild(createPagination(paginated, row, companyName));
      }

      tabContentContainer.appendChild(contentDiv);
    }
  }

  function createTabPane(id, active = false) {
    const div = document.createElement('div');
    div.className = `tab-pane fade${active ? ' show active' : ''}`;
    div.id = id;
    div.setAttribute('role', 'tabpanel');
    div.setAttribute('aria-labelledby', `${id}-tab`);
    return div;
  }

  function createPagination(pages, container, companyName) {
    const wrapper = document.createElement('div');
    wrapper.className = 'pagination d-flex gap-2 mt-4';

    pages.forEach((page, pageIndex) => {
      const btn = document.createElement('button');
      btn.className = 'btn btn-sm btn-outline-primary';
      btn.innerText = pageIndex + 1;
      btn.addEventListener('click', () => {
        container.innerHTML = '';
        renderProductCards(container, page, companyName); // 👈 Pass companyName
      });
      wrapper.appendChild(btn);
    });

    return wrapper;
  }
  function renderProductCards(container, products, companyName) {
    container.innerHTML = products.map(product => {
      const productUrl = generateProductUrl(companyName, product.id);

      return `
      <div class="col-lg-4 col-sm-6">
        <div class="product-item section-bg">
          <div class="product-item__thumb d-flex">
            <a href="${productUrl}" class="link w-100">
              <img src="${product.image}" alt="" class="cover-img">
            </a>
          </div>
          <div class="product-item__content">
            <h6 class="product-item__title">
              <a href="${productUrl}" class="link">${product.title}</a>
            </h6>
            <div class="product-item__info flx-between gap-2">
              <div class="flx-align gap-2">
                <h6 class="product-item__price mb-0">$${product.price}</h6>
              </div>
            </div>
            <div class="product-item__bottom flx-between gap-2">
              <div>
                <span class="product-item__sales font-14 mb-2">${product.sales} Sales</span>
              </div>
              <a href="${productUrl}" class="btn btn-outline-light btn-sm pill">Read more</a>
            </div>
          </div>
        </div>
      </div>
    `;
    }).join('');
  }

  function paginate(items, perPage) {
    const pages = [];
    for (let i = 0; i < items.length; i += perPage) {
      pages.push(items.slice(i, i + perPage));
    }
    return pages;
  }

  function toSlug(str) {
    return str.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9\-]/g, '').trim();
  }
});
