document.addEventListener('DOMContentLoaded', () => {
  const countriesRow = document.getElementById('countries-row');
  const paginationContainer = document.getElementById('countries-pagination');

  const ITEMS_PER_PAGE = 6;
  let currentPage = 1;
  let countries = [];

  initCountryCards();

  async function initCountryCards() {
    try {
      const data = await fetchData();
      countries = data.countries;

      renderCountries(currentPage);
    } catch (error) {
      console.error('Error loading countries:', error);
      countriesRow.innerHTML = `
        <div class="col-12">
          <div class="alert alert-danger text-center">Failed to load countries. Try again later.</div>
        </div>
      `;
    }
  }

  async function fetchData() {
    const response = await fetch('/api/countries');
    if (!response.ok) throw new Error('Failed to fetch countries data');
    return { countries: await response.json() };
  }

  function renderCountries(page) {
    const start = (page - 1) * ITEMS_PER_PAGE;
    const end = start + ITEMS_PER_PAGE;
    const paginatedCountries = countries.slice(start, end);

    countriesRow.innerHTML = '';
    paginationContainer.innerHTML = '';

    if (paginatedCountries.length === 0) {
      countriesRow.innerHTML = `<div class="col-12 text-center text-warning">No countries found.</div>`;
      return;
    }

    paginatedCountries.forEach(country => {
      countriesRow.appendChild(createCountryCard(country));
    });

    if (countries.length > ITEMS_PER_PAGE) {
      const pagination = createPagination(countries.length, page);
      paginationContainer.appendChild(pagination);
    }
  }

  function createCountryCard(country) {
    const col = document.createElement('div');
    col.className = 'col-lg-4';

    // Get current language for translations
    const currentLang = getCookie('i18next') || 'uz';
    
    // Simple translations
    const translations = {
      uz: {
        moreManufacturers: "Ushbu mamlakatda ko'proq ishlab chiqaruvchilar",
        enterToNext: "keyingisiga o'tish"
      },
      en: {
        moreManufacturers: "More Manufacturers in this country",
        enterToNext: "enter to next"
      },
      ru: {
        moreManufacturers: "Больше производителей в этой стране",
        enterToNext: "перейти к следующему"
      }
    };

    const t = translations[currentLang] || translations.en;

    col.innerHTML = `
      <div class="thank-card">
        <h5 class="thank-card__title mb-3">${country.name}</h5>
        <div class="thank-card__thumb">
          <img src="${country.flag}" alt="${country.name}">
        </div>
        <div class="flx-between gap-2">
          <p class="text">${t.moreManufacturers}</p>
          <a href="/product-country?country=${encodeURIComponent(country.name)}" class="btn btn-main flx-align gap-2 pill">
            ${t.enterToNext}
            <span class="icon line-height-1 font-20"><i class="las la-arrow-right"></i></span>
          </a>
        </div>
      </div>
    `;
    return col;
  }

  function createPagination(totalItems, currentPage) {
    const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
    const nav = document.createElement('nav');
    nav.setAttribute('aria-label', 'Country pagination');
    nav.className = 'col-12 mt-4';

    const ul = document.createElement('ul');
    ul.className = 'pagination justify-content-center';

    // Previous
    ul.innerHTML += `
      <li class="page-item ${currentPage === 1 ? 'disabled' : ''}">
        <a class="page-link" href="#" data-page="${currentPage - 1}">&laquo;</a>
      </li>`;

    // Numbers
    for (let i = 1; i <= totalPages; i++) {
      ul.innerHTML += `
        <li class="page-item ${i === currentPage ? 'active' : ''}">
          <a class="page-link" href="#" data-page="${i}">${i}</a>
        </li>`;
    }

    // Next
    ul.innerHTML += `
      <li class="page-item ${currentPage === totalPages ? 'disabled' : ''}">
        <a class="page-link" href="#" data-page="${currentPage + 1}">&raquo;</a>
      </li>`;

    nav.appendChild(ul);

    ul.addEventListener('click', (e) => {
      e.preventDefault();
      const link = e.target.closest('a');
      if (!link) return;

      const page = parseInt(link.getAttribute('data-page'));
      if (!isNaN(page) && page >= 1 && page <= totalPages) {
        currentPage = page;
        renderCountries(currentPage);
        window.scrollTo({ top: countriesRow.offsetTop - 100, behavior: 'smooth' });
      }
    });

    return nav;
  }

  // Helper function to get cookie
  function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
  }
});