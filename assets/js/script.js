const STORAGE_KEY = 'simracingConfig';
const BUNDLES_SHOW_KEY = 'liftitShowBundles';

let currentConfig = {
    bundle: { name: 'None', price: 0 },
    cockpit: { name: 'None', price: 0 },
    seat: { name: 'None', price: 0 },
    accessory: [],
    volant: { name: 'None', price: 0 },
    pedalier: { name: 'None', price: 0 },
    base: { name: 'None', price: 0 }
};

let allData = {};

let showBundles = false;

const categoryMap = {
    'bundles': 'bundle',
    'cockpits': 'cockpit',
    'sieges': 'seat',
    'accessoires': 'accessory',
    'volants': 'volant',
    'pedaliers': 'pedalier',
    'bases': 'base'
};

document.addEventListener('DOMContentLoaded', () => {
    console.log("Script version 6.2 loaded.");

    const welcomeModal = document.getElementById('welcome-modal');
    const closeModalBtn = document.getElementById('close-modal-btn');
    const MODAL_SHOWN_KEY = 'liftitWelcomeShown';

    setTimeout(() => {
        welcomeModal.classList.add('visible');
    }, 100);

    closeModalBtn.addEventListener('click', () => {
        welcomeModal.classList.remove('visible');
        localStorage.setItem(MODAL_SHOWN_KEY, 'true');
    });

    const dataFile = 'data.json';

    fetch(dataFile)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP Error: ${response.status}`);
            }
            return response.json();
        })
        .then(jsonData => {
            allData = jsonData;

            sortDataByPrice(allData);

            loadConfig();

            try {
                showBundles = localStorage.getItem(BUNDLES_SHOW_KEY) === 'true';
            } catch (e) {
                showBundles = false;
            }

            const toggleEl = document.getElementById('toggle-bundles');
            if (toggleEl) toggleEl.checked = showBundles;
            if (toggleEl) toggleEl.addEventListener('change', window.toggleBundles);

            renderConfiguration();
            updateSummary();
        })
        .catch(error => {
            console.error("Data loading error:", error);
            document.getElementById('config-sections').innerHTML =
                `<p style="color:red; text-align:center;">Data loading error: ${error.message}.</p>`;
        });
});


function sortDataByPrice(data) {
    Object.keys(data).forEach(categoryKey => {
        const categoryData = data[categoryKey];
        if (categoryData && categoryData.length > 0) {

            const sortByTotal = categoryKey && categoryData[0].total !== undefined;

            categoryData.sort((a, b) => {
                const priceA = sortByTotal ? a.total : a.price;
                const priceB = sortByTotal ? b.total : b.price;

                const numA = parseFloat(priceA) || 0;
                const numB = parseFloat(priceB) || 0;

                return numA - numB;
            });
        }
    });
}

window.filterConfiguration = function () {
    const searchTerm = document.getElementById('product-search').value.toLowerCase().trim();

    if (searchTerm === '') {
        document.querySelectorAll('.item-card').forEach(card => {
            card.style.display = 'flex';
        });
        document.querySelectorAll('details.category-section').forEach(details => {
            details.style.display = '';
        });
        return;
    }

    let categoryHasVisibleItems = {};

    document.querySelectorAll('.item-card').forEach(card => {
        const name = card.dataset.name.toLowerCase();
        const categoryKey = card.dataset.category.toUpperCase();

        if (name.includes(searchTerm)) {
            card.style.display = 'flex';
            categoryHasVisibleItems[categoryKey] = true;
        } else {
            card.style.display = 'none';
        }
    });

    document.querySelectorAll('.category-title').forEach(title => {
        const categoryKey = title.dataset.category;
        const details = title.closest('details.category-section');

        if (categoryHasVisibleItems[categoryKey]) {
            if (details) details.style.display = '';
        } else {
            if (details) details.style.display = 'none';
        }
    });
}

function saveConfig() {
    try {
        const serializedConfig = JSON.stringify(currentConfig);
        localStorage.setItem(STORAGE_KEY, serializedConfig);
    } catch (e) {
        console.warn("Error saving to LocalStorage", e);
    }
}

function loadConfig() {
    try {
        const serializedConfig = localStorage.getItem(STORAGE_KEY);
        if (serializedConfig === null) {
            return undefined;
        }

        const loadedConfig = JSON.parse(serializedConfig);

        if (loadedConfig && typeof loadedConfig === 'object') {
            currentConfig = Object.assign({}, currentConfig, loadedConfig);
        }

    } catch (e) {
        console.warn("Error loading from LocalStorage", e);
    }
}


function getSelectedCockpitData() {
    const cockpitName = currentConfig.cockpit.name;
    if (cockpitName === 'None' || !allData.COCKPITS) {
        return null;
    }
    return allData.COCKPITS.find(item => item.name === cockpitName) || null;
}


function resetSeatIfIncluded(selectedCockpitHasSeat) {
    if (selectedCockpitHasSeat && currentConfig.seat.name !== 'None') {
        document.querySelectorAll('#cards-sieges .item-card.selected').forEach(card => {
            card.classList.remove('selected');
        });

        currentConfig.seat = { name: 'None', price: 0 };
    }
}

function updateSeatSectionState() {
    const cockpitData = getSelectedCockpitData();
    const seatsEnabled = !cockpitData || !cockpitData.wSeat;

    document.querySelectorAll('#cards-sieges .item-card').forEach(card => {
        if (seatsEnabled) {
            card.classList.remove('disabled');
        } else {
            card.classList.add('disabled');
        }
    });

    const seatTitle = document.querySelector('.category-title[data-category="SIEGES"]');
    if (seatTitle) {
        if (!seatsEnabled) {
            seatTitle.textContent = 'Seats (Included with Cockpit)';
            seatTitle.style.opacity = '0.5';
        } else {
            seatTitle.textContent = 'Seats';
            seatTitle.style.opacity = '1';
        }
    }
}


function renderConfiguration() {
    const configSections = document.getElementById('config-sections');
    configSections.innerHTML = '';

    const categoryNames = {
        BUNDLES: 'Bundles',
        COCKPITS: 'Cockpits',
        SIEGES: 'Seats',
        ACCESSOIRES: 'Accessories',
        VOLANTS: 'Steering Wheels',
        PEDALIERS: 'Pedals',
        BASES: 'Bases'
    };

    Object.keys(allData).forEach(categoryKey => {
        if (categoryKey === 'BUNDLES' && !showBundles) return;
        const categoryData = allData[categoryKey];
        if (!categoryData || categoryData.length === 0) return;

        const categoryPlural = categoryKey.toLowerCase();
        const categorySingular = categoryMap[categoryPlural];

        const details = document.createElement('details');
        details.className = 'category-section';
        details.dataset.category = categoryKey;
        details.innerHTML = `
            <summary class="category-title" data-category="${categoryKey}">${categoryNames[categoryKey]}</summary>
            <div id="cards-${categoryPlural}" class="card-container"></div>
        `;
        configSections.appendChild(details);

        const cardContainer = details.querySelector(`#cards-${categoryPlural}`);

        categoryData.forEach(item => {
            const card = document.createElement('div');
            card.className = 'item-card';

            card.dataset.category = categoryPlural;
            card.dataset.name = item.name;
            card.dataset.price = item.price.toString();

            if (categoryKey === 'COCKPITS' && item.wSeat !== undefined) {
                card.dataset.wseat = item.wSeat.toString();
            }

            const isSelected = checkIsSelected(categorySingular, item.name);
            if (isSelected) {
                card.classList.add('selected');
            }

            let cardContent = `
                <div class="card-image-container">
                    ${item.imageUrl ? `<img src="${item.imageUrl}" alt="${item.name}" class="item-image">` : ''}
                </div>
                <div class="card-text-content">
                    <div class="card-name">${item.name}</div>
                    <div class="card-price">${formatPrice(item.price)}</div>
                    ${item.linkUrl ? `<a href="${item.linkUrl}" target="_blank" class="card-link">View product</a>` : ''}
                </div>
            `;

            card.innerHTML = cardContent;

            card.addEventListener('click', handleCardSelection);
            cardContainer.appendChild(card);
        });
    });

    document.querySelectorAll('details.category-section').forEach(details => {
        const summary = details.querySelector('summary.category-title');
        if (!summary) return;

        summary.setAttribute('role', 'button');
        summary.setAttribute('tabindex', '0');
        summary.setAttribute('aria-expanded', details.open ? 'true' : 'false');

        details.addEventListener('toggle', () => {
            summary.setAttribute('aria-expanded', details.open ? 'true' : 'false');
        });
    });

    updateSeatSectionState();
}

function checkIsSelected(categorySingular, itemName) {
    if (categorySingular === 'accessory') {
        return currentConfig.accessory.some(item => item.name === itemName);
    } else {
        return currentConfig[categorySingular].name === itemName;
    }
}


window.toggleBundles = function (event) {
    const checked = event && event.target ? event.target.checked : !!event;
    showBundles = checked;
    try {
        localStorage.setItem(BUNDLES_SHOW_KEY, showBundles ? 'true' : 'false');
    } catch (e) { }
    renderConfiguration();
}

function handleCardSelection(event) {
    const card = event.currentTarget;
    const categoryPlural = card.dataset.category;
    const categorySingular = categoryMap[categoryPlural];
    const name = card.dataset.name;
    const price = parseFloat(card.dataset.price);

    const isAccessory = categoryPlural === 'accessoires';
    const isSelected = card.classList.contains('selected');

    if (categorySingular === 'seat') {
        const cockpitData = getSelectedCockpitData();
        if (cockpitData && cockpitData.wSeat) {
            console.warn(`Cannot select a seat. The selected cockpit, '${cockpitData.name}', already includes a seat (wSeat: true).`);
            return;
        }
    }

    if (card.classList.contains('disabled')) {
        return;
    }

    if (isAccessory) {
        if (isSelected) {
            card.classList.remove('selected');
            currentConfig[categorySingular] = currentConfig[categorySingular].filter(item => item.name !== name);
        } else {
            card.classList.add('selected');
            currentConfig[categorySingular].push({ name, price });
        }
    } else {
        const container = document.getElementById(`cards-${categoryPlural}`);

        container.querySelectorAll('.item-card').forEach(c => c.classList.remove('selected'));

        let selectedItemData = { name: 'None', price: 0 };
        let newCockpitHasSeat = false;

        if (!isSelected) {
            card.classList.add('selected');
            selectedItemData = { name, price };

            if (categorySingular === 'cockpit') {
                const selectedCockpitFullData = allData.COCKPITS.find(item => item.name === name);
                newCockpitHasSeat = selectedCockpitFullData && selectedCockpitFullData.wSeat;
            }
        }

        currentConfig[categorySingular] = selectedItemData;

        if (categorySingular === 'cockpit') {
            resetSeatIfIncluded(newCockpitHasSeat);
            updateSeatSectionState();
        }
    }

    updateSummary();
}

function updateSummary() {
    let totalPrice = 0;

    ['bundle', 'cockpit', 'seat', 'volant', 'pedalier', 'base'].forEach(key => {
        const item = currentConfig[key];
        const summaryElement = document.getElementById(`summary-${key}`);

        if (summaryElement) {
            summaryElement.textContent = item.name;
            totalPrice += item.price;
        }
    });

    const accessoryContainer = document.getElementById('summary-accessory-container');
    accessoryContainer.innerHTML = '';

    if (currentConfig.accessory.length === 0) {
        accessoryContainer.innerHTML = '<p class="accessory-item-summary">None</p>';
    } else {
        currentConfig.accessory.forEach(item => {
            const accessoryP = document.createElement('p');
            accessoryP.className = 'accessory-item-summary';
            accessoryP.textContent = `${item.name} (${formatPrice(item.price)})`;
            accessoryContainer.appendChild(accessoryP);

            totalPrice += item.price;
        });
    }

    document.getElementById('total-price').textContent = formatPrice(totalPrice);

    saveConfig();
}

function formatPrice(price) {
    return price.toLocaleString('en-GB', {
        style: 'currency',
        currency: 'EUR'
    });
}


window.resetConfiguration = function () {
    currentConfig = {
        bundle: { name: 'None', price: 0 },
        cockpit: { name: 'None', price: 0 },
        seat: { name: 'None', price: 0 },
        accessory: [],
        volant: { name: 'None', price: 0 },
        pedalier: { name: 'None', price: 0 },
        base: { name: 'None', price: 0 }
    };

    document.querySelectorAll('.item-card.selected').forEach(card => {
        card.classList.remove('selected');
    });

    localStorage.removeItem(STORAGE_KEY);

    updateSeatSectionState();

    updateSummary();
}