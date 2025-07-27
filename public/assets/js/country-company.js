document.addEventListener('DOMContentLoaded', () => {

  const companyList = document.getElementById('company-list');
  
  // Exit early if the required element doesn't exist on this page
  if (!companyList) {
    console.log('Country-company script: Required elements not found on this page');
    return;
  }

  const urlParams = new URLSearchParams(window.location.search);
  const countryName = urlParams.get('country');
  const ITEMS_PER_PAGE = 8;
  let currentPage = 1;
  let currentCompanies = [];

  const titleEl = document.querySelector('.breadcrumb-two-content__title');
  if (titleEl && countryName) {
    titleEl.textContent = `Manufacturers of ${countryName}`;
  }

  if (!countryName) {
    companyList.innerHTML = `<div class="col-12 text-center text-danger">Country not found.</div>`;
    return;
  }

  initCompanyDisplay();

  async function initCompanyDisplay() {
    try {
      const data = await fetchData();
      const country = data.countries.find(c => c.name.toLowerCase() === countryName.toLowerCase());

      if (!country) {
        companyList.innerHTML = `<div class="col-12 text-center text-warning">No data found for ${countryName}</div>`;
        return;
      }

      currentCompanies = country.companies;
      renderCompanies(currentPage);
    } catch (error) {
      console.error(error);
      companyList.innerHTML = `<div class="col-12 text-center text-danger">Failed to load companies.</div>`;
    }
  }

  async function fetchData() {
    const response = await fetch('data.json');
    if (!response.ok) throw new Error('Failed to fetch data.json');
    return await response.json();
  }

  function renderCompanies(page) {
    const start = (page - 1) * ITEMS_PER_PAGE;
    const end = start + ITEMS_PER_PAGE;
    const paginatedCompanies = currentCompanies.slice(start, end);

    companyList.innerHTML = '';
    if (paginatedCompanies.length === 0) {
      companyList.innerHTML = `<div class="col-12 text-center text-warning">No companies found.</div>`;
      return;
    }

    paginatedCompanies.forEach(company => {
      const col = createCompanyCard(company);
      companyList.appendChild(col);
    });

    // Pagination
    if (currentCompanies.length > ITEMS_PER_PAGE) {
      const pagination = createPagination(currentCompanies.length, page);
      companyList.appendChild(pagination);
    }
  }

  function createCompanyCard(company) {
    const col = document.createElement('div');
    col.className = 'col-lg-3 col-sm-4';
    const companyParam = encodeURIComponent(company.name);

    col.innerHTML = `
      <div class="post-item">
        <div class="post-item__thumb">
          <a href="about-company.html?company-name=${companyParam}" class="link">
            <img src="${company.img}" class="cover-img" alt="${company.name}">
          </a>
        </div>
        <div class="post-item__content">
          <h5 class="post-item__title mb-3">
            <a href="about-company.html?company-name=${companyParam}" class="link">${company.name}</a>
          </h5>
          <p class="mb-3">Qo‘shilgan sana: ${company.dateAdded}</p>
          <a href="about-company.html?company-name=${companyParam}" class="btn btn-outline-light pill fw-600">Read More </a>
        </div>
      </div>
    `;

    return col;
  }

  function createPagination(totalItems, currentPage) {
    const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
    const nav = document.createElement('nav');
    nav.setAttribute('aria-label', 'Company pagination');
    nav.className = 'col-12 mt-4';

    const ul = document.createElement('ul');
    ul.className = 'pagination justify-content-center';

    // Previous button
    ul.innerHTML += `
      <li class="page-item ${currentPage === 1 ? 'disabled' : ''}">
        <a class="page-link" href="#" data-page="${currentPage - 1}">&laquo;</a>
      </li>`;

    // Page numbers
    for (let i = 1; i <= totalPages; i++) {
      ul.innerHTML += `
        <li class="page-item ${i === currentPage ? 'active' : ''}">
          <a class="page-link" href="#" data-page="${i}">${i}</a>
        </li>`;
    }

    // Next button
    ul.innerHTML += `
      <li class="page-item ${currentPage === totalPages ? 'disabled' : ''}">
        <a class="page-link" href="#" data-page="${currentPage + 1}">&raquo;</a>
      </li>`;

    nav.appendChild(ul);

    // Event delegation
    ul.addEventListener('click', (e) => {
      e.preventDefault();
      const target = e.target.closest('a');
      if (!target) return;

      const page = parseInt(target.getAttribute('data-page'));
      if (!isNaN(page) && page >= 1 && page <= totalPages) {
        currentPage = page;
        renderCompanies(currentPage);
        window.scrollTo({ top: companyList.offsetTop - 100, behavior: 'smooth' });
      }
    });

    return nav;
  }
});
