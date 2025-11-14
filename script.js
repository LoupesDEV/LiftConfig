// Clé utilisée dans le LocalStorage
const STORAGE_KEY = 'simracingConfig';

let currentConfig = {
    bundle: { name: 'Aucun', price: 0 },
    cockpit: { name: 'Aucun', price: 0 },
    seat: { name: 'Aucun', price: 0 },
    accessory: [] 
};

let allData = {};

const categoryMap = {
    'bundles': 'bundle',
    'cockpits': 'cockpit',
    'sieges': 'seat',
    'accessoires': 'accessory'
};

document.addEventListener('DOMContentLoaded', () => {
    console.log("Script version 5.1 (LocalStorage) chargé."); 
    
    const dataFile = 'data.json'; 

    fetch(dataFile)
        .then(response => {
             if (!response.ok) {
                throw new Error(`Erreur HTTP: ${response.status}`);
            }
            return response.json();
        })
        .then(jsonData => {
            allData = jsonData; 
            
            loadConfig(); 

            renderConfiguration();
            updateSummary();
        })
        .catch(error => {
            console.error("Erreur de chargement des données:", error);
            document.getElementById('config-sections').innerHTML = 
                `<p style="color:red; text-align:center;">Erreur de chargement des données: ${error.message}.</p>`;
        });
});


function saveConfig() {
    try {
        const serializedConfig = JSON.stringify(currentConfig);
        localStorage.setItem(STORAGE_KEY, serializedConfig);
    } catch (e) {
        console.warn("Erreur lors de la sauvegarde dans LocalStorage", e);
    }
}


function loadConfig() {
    try {
        const serializedConfig = localStorage.getItem(STORAGE_KEY);
        if (serializedConfig === null) {
            return undefined;
        }
        
        const loadedConfig = JSON.parse(serializedConfig);
        
        if (loadedConfig.bundle && loadedConfig.accessory) {
            currentConfig = loadedConfig;
        }

    } catch (e) {
        console.warn("Erreur lors du chargement depuis LocalStorage", e);
    }
}


function renderConfiguration() {
    const configSections = document.getElementById('config-sections');
    configSections.innerHTML = ''; 

    const categoryNames = {
        BUNDLES: 'Bundles',
        COCKPITS: 'Cockpits',
        SIEGES: 'Sièges',
        ACCESSOIRES: 'Accessoires'
    };
    
    Object.keys(allData).forEach(categoryKey => {
        const categoryData = allData[categoryKey];
        if (!categoryData || categoryData.length === 0) return;

        const categoryPlural = categoryKey.toLowerCase();
        const categorySingular = categoryMap[categoryPlural]; 
        
        const section = document.createElement('div');
        section.innerHTML = `
            <h2 class="category-title">${categoryNames[categoryKey]}</h2>
            <div id="cards-${categoryPlural}" class="card-container">
            </div>
        `;
        configSections.appendChild(section);

        const cardContainer = document.getElementById(`cards-${categoryPlural}`);

        categoryData.forEach(item => {
            const card = document.createElement('div');
            card.className = 'item-card';
            
            card.dataset.category = categoryPlural; 
            card.dataset.name = item.name;
            card.dataset.price = item.price.toString(); 

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
                    ${item.linkUrl ? `<a href="${item.linkUrl}" target="_blank" class="card-link">Voir le produit</a>` : ''}
                </div>
            `;

            card.innerHTML = cardContent;
            
            card.addEventListener('click', handleCardSelection);
            cardContainer.appendChild(card);
        });
    });
}


function checkIsSelected(categorySingular, itemName) {
    if (categorySingular === 'accessory') {
        return currentConfig.accessory.some(item => item.name === itemName);
    } else {
        return currentConfig[categorySingular].name === itemName;
    }
}

function handleCardSelection(event) {
    const card = event.currentTarget;
    const categoryPlural = card.dataset.category; 
    const categorySingular = categoryMap[categoryPlural]; 
    const name = card.dataset.name;
    const price = parseFloat(card.dataset.price);

    const isAccessory = categoryPlural === 'accessoires';
    const isSelected = card.classList.contains('selected');

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

        if (isSelected) {
            currentConfig[categorySingular] = { name: 'Aucun', price: 0 };
        } else {
            card.classList.add('selected');
            currentConfig[categorySingular] = { name, price };
        }
    }

    updateSummary();
}


function updateSummary() {
    let totalPrice = 0;

    ['bundle', 'cockpit', 'seat'].forEach(key => {
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
        accessoryContainer.innerHTML = '<p class="accessory-item-summary">Aucun</p>';
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
    return price.toLocaleString('fr-FR', {
        style: 'currency',
        currency: 'EUR'
    });
}


window.resetConfiguration = function() {
    currentConfig = {
        bundle: { name: 'Aucun', price: 0 },
        cockpit: { name: 'Aucun', price: 0 },
        seat: { name: 'Aucun', price: 0 },
        accessory: [] 
    };

    document.querySelectorAll('.item-card.selected').forEach(card => {
        card.classList.remove('selected');
    });

    localStorage.removeItem(STORAGE_KEY);
    
    updateSummary();
}
