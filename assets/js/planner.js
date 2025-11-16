document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('room-canvas');
    const ctx = canvas.getContext('2d');
    const plannerArea = document.getElementById('planner-area');

    let allCockpits = [];
    let roomDimensionsCm = { width: 400, height: 300 };
    let objects = [];
    
    let currentScaleFactor = 0.5;
    
    let isDragging = false;
    let selectedObject = null;
    let dragOffsetX = 0;
    let dragOffsetY = 0;
    
    const rotationControl = document.getElementById('rotation-control');
    const rotationSlider = document.getElementById('rotation-slider');
    const rotationValueDisplay = document.getElementById('rotation-value');
    const selectedObjectName = document.getElementById('selected-object-name');
    const deleteButton = document.getElementById('delete-object-btn');
    
    const exportButton = document.getElementById('export-plan-btn');
    const importFile = document.getElementById('import-file');


    function exportPlan() {
        // Export positions in centimeters to make the file resolution-independent
        const exportedObjects = objects.map(o => ({
            name: o.name,
            widthCm: Number(o.widthCm),
            heightCm: Number(o.heightCm),
            rotation: Number(o.rotation) || 0,
            x: Number((o.x / currentScaleFactor).toFixed(3)),
            y: Number((o.y / currentScaleFactor).toFixed(3)),
            color: o.color
        }));

        const planData = {
            roomDimensionsCm: roomDimensionsCm,
            objects: exportedObjects
        };

        const jsonString = JSON.stringify(planData, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = 'simracing_plan.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }


    function importPlan(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const planData = JSON.parse(e.target.result);

                // Support a couple of small variations and coerce types to numbers
                const rd = planData.roomDimensionsCm || planData.roomSize || null;

                if (rd && Array.isArray(planData.objects) && planData.objects.length >= 0) {
                    const w = Number(rd.width);
                    const h = Number(rd.height);

                    if (!isNaN(w) && !isNaN(h) && w > 0 && h > 0) {
                        roomDimensionsCm = { width: w, height: h };
                        // update inputs so UI reflects imported values
                        document.getElementById('room-width').value = roomDimensionsCm.width;
                        document.getElementById('room-height').value = roomDimensionsCm.height;
                    }

                    // Recompute scale now that room size is set
                    updateScaleFactor();

                    // Normalize objects and convert positions to internal pixel coordinates
                    objects = planData.objects.map(obj => {
                        const widthCm = Number(obj.widthCm) || Number(obj.width) || 50;
                        const heightCm = Number(obj.heightCm) || Number(obj.lengthCm) || Number(obj.height) || 50;
                        const rotation = Number(obj.rotation) || 0;

                        // Imported x/y are expected to be in cm (exported by new exporter). But
                        // older files may have x/y stored in pixels. Detect heuristically:
                        // if the imported x or y is larger than room dimensions (in cm) by a margin,
                        // assume it's pixels and convert to cm by dividing by currentScaleFactor.
                        let rawX = obj.x ?? obj.xCm ?? obj.x_cm ?? 0;
                        let rawY = obj.y ?? obj.yCm ?? obj.y_cm ?? 0;

                        rawX = Number(rawX) || 0;
                        rawY = Number(rawY) || 0;

                        let xCm = rawX;
                        let yCm = rawY;

                        const roomMax = Math.max(roomDimensionsCm.width, roomDimensionsCm.height);

                        // If coordinates look like pixels (much larger than room size in cm), convert to cm
                        if (rawX > roomMax * 1.5 || rawY > roomMax * 1.5) {
                            xCm = rawX / currentScaleFactor;
                            yCm = rawY / currentScaleFactor;
                        }

                        // Final internal pixel coordinates
                        const x_px = Math.min(Math.max(0, xCm * currentScaleFactor), Math.max(0, canvas.width - widthCm * currentScaleFactor));
                        const y_px = Math.min(Math.max(0, yCm * currentScaleFactor), Math.max(0, canvas.height - heightCm * currentScaleFactor));

                        return {
                            name: obj.name || 'Object',
                            widthCm: widthCm,
                            heightCm: heightCm,
                            rotation: rotation,
                            x: x_px,
                            y: y_px,
                            color: obj.color || 'rgba(100, 100, 100, 0.7)'
                        };
                    });

                    selectedObject = null;

                    draw();
                    updateControlPanelState();
                    alert('Plan loaded successfully! (positions normalized)');

                } else {
                    alert('Error: The JSON file is not a valid plan (missing roomDimensionsCm or objects).');
                }
            } catch (error) {
                alert("Error: Unable to read the file. Make sure it's a valid JSON.");
                console.error("Import error:", error);
            }
        };
        reader.readAsText(file);
    }


    function updateScaleFactor() {
        const padding = 20;
        
        const controlsHeight = document.getElementById('controls-section').offsetHeight;
        const availableHeight = plannerArea.clientHeight - controlsHeight - padding;
        const availableWidth = plannerArea.clientWidth - padding;

        const scaleX = availableWidth / roomDimensionsCm.width;
        const scaleY = availableHeight / roomDimensionsCm.height;
        
        currentScaleFactor = Math.min(scaleX, scaleY);
        
        if (currentScaleFactor <= 0 || isNaN(currentScaleFactor)) currentScaleFactor = 0.1;
        
        document.getElementById('scale-value').textContent = currentScaleFactor.toFixed(3);
        
        canvas.width = roomDimensionsCm.width * currentScaleFactor;
        canvas.height = roomDimensionsCm.height * currentScaleFactor;
        
        const marginLeft = (plannerArea.clientWidth - canvas.width) / 2;
        canvas.style.marginLeft = `${Math.max(10, marginLeft)}px`;
    }


    function populateCockpitSelector() {
        const selector = document.getElementById('cockpit-selector');
        selector.innerHTML = '<option value="">Select a Cockpit</option>'; 
        
        allCockpits.forEach(cockpit => {
            const option = document.createElement('option');
            option.value = cockpit.name;
            const dimText = cockpit.widthCm && cockpit.lengthCm 
                            ? ` (${cockpit.widthCm}x${cockpit.lengthCm} cm)` 
                            : ' (Unknown dimensions)';
            option.textContent = `${cockpit.name}${dimText}`;
            selector.appendChild(option);
        });
    }

    
    function updateControlPanelState() {
        if (selectedObject) {
            rotationSlider.value = selectedObject.rotation;
            rotationValueDisplay.textContent = selectedObject.rotation;
            selectedObjectName.textContent = selectedObject.name;
            rotationControl.style.display = 'block';
            deleteButton.disabled = false;
        } else {
            rotationControl.style.display = 'none';
            deleteButton.disabled = true;
        }
    }

    
    function addObject(name, widthCm, heightCm, color) {
        const w_px = widthCm * currentScaleFactor;
        const h_px = heightCm * currentScaleFactor;

        const newObject = {
            name: name,
            widthCm: widthCm,
            heightCm: heightCm,
            rotation: 0, 
            x: (canvas.width / 2) - (w_px / 2), 
            y: (canvas.height / 2) - (h_px / 2),
            color: color || 'rgba(100, 100, 100, 0.7)'
        };

        objects.push(newObject);
        draw();
    }

    
    async function loadDataAndInit() {
        try {
            const response = await fetch('data.json');
            if (!response.ok) throw new Error('Failed to load JSON.');
            const data = await response.json();
            
            allCockpits = data.COCKPITS
                .filter(item => item.name && item.name.length > 0)
                .sort((a, b) => (a.name > b.name) ? 1 : -1);

            allCockpits.forEach(c => {
                c.lengthCm = parseFloat(c.lengthCm) || 150; 
                c.widthCm = parseFloat(c.widthCm) || 60;
            });

            populateCockpitSelector();
            
            document.getElementById('set-room-size').click(); 
            
        } catch (error) {
            console.error('Error loading or initializing data:', error);
        }
    }

    
    function draw() {
        updateScaleFactor(); 
        
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        ctx.strokeStyle = '#444';
        ctx.lineWidth = 1;
        ctx.strokeRect(0, 0, canvas.width, canvas.height);

        objects.forEach(obj => {
            const w = obj.widthCm * currentScaleFactor;
            const h = obj.heightCm * currentScaleFactor;
            
            const centerX = obj.x + w / 2;
            const centerY = obj.y + h / 2;
            
            ctx.save();
            ctx.translate(centerX, centerY);
            ctx.rotate(obj.rotation * Math.PI / 180);
            ctx.translate(-w / 2, -h / 2);
            
            ctx.fillStyle = obj === selectedObject ? 'rgba(179, 27, 27, 0.8)' : obj.color;
            ctx.fillRect(0, 0, w, h); 

            if (obj === selectedObject) {
                ctx.strokeStyle = '#EAEAEA';
                ctx.lineWidth = 3;
                ctx.strokeRect(0, 0, w, h);
            }

            const isLongName = obj.name.length > 15;
            ctx.fillStyle = isLongName ? '#FFD700' : '#EAEAEA';
            ctx.font = isLongName ? 'italic bold 12px Arial' : 'bold 12px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(obj.name, w / 2, h / 2 + 4);
            
            ctx.restore();
        });
    }

    function getCanvasCoords(event) {
        const rect = canvas.getBoundingClientRect();
        let clientX, clientY;

        if (event.touches) {
            clientX = event.touches[0].clientX;
            clientY = event.touches[0].clientY;
        } else {
            clientX = event.clientX;
            clientY = event.clientY;
        }
        
        return {
            x: clientX - rect.left,
            y: clientY - rect.top
        };
    }

    
    function findObjectAt(x, y) {
        for (let i = objects.length - 1; i >= 0; i--) {
            const obj = objects[i];
            const w = obj.widthCm * currentScaleFactor;
            const h = obj.heightCm * currentScaleFactor;

            const centerX = obj.x + w / 2;
            const centerY = obj.y + h / 2;

            const angleRad = -obj.rotation * Math.PI / 180;
            const cos = Math.cos(angleRad);
            const sin = Math.sin(angleRad);

            const dx = x - centerX;
            const dy = y - centerY;

            const rotatedX = dx * cos - dy * sin;
            const rotatedY = dx * sin + dy * cos;

            if (rotatedX >= -w / 2 && rotatedX <= w / 2 && rotatedY >= -h / 2 && rotatedY <= h / 2) {
                return obj;
            }
        }
        return null;
    }

    function constrainObject(obj) {
        const w = obj.widthCm * currentScaleFactor;
        const h = obj.heightCm * currentScaleFactor;

        obj.x = Math.max(0, obj.x);
        obj.y = Math.max(0, obj.y);

        obj.x = Math.min(obj.x, canvas.width - w);
        obj.y = Math.min(obj.y, canvas.height - h);
    }


    function handlePointerDown(event) {
        event.preventDefault(); 
        
        const { x, y } = getCanvasCoords(event);
        const obj = findObjectAt(x, y);

        if (obj) {
            selectedObject = obj;
            isDragging = true;
            
            dragOffsetX = x - obj.x;
            dragOffsetY = y - obj.y;
            
            objects = objects.filter(o => o !== obj);
            objects.push(obj);

            updateControlPanelState();

        } else {
            selectedObject = null;
            updateControlPanelState();
        }

        draw();
    }

    function handlePointerMove(event) {
        if (!isDragging || !selectedObject) return;

        const { x, y } = getCanvasCoords(event);
        
        selectedObject.x = x - dragOffsetX;
        selectedObject.y = y - dragOffsetY;

        constrainObject(selectedObject); 

        draw();
    }

    function handlePointerUp() {
        isDragging = false;
    }

    function deleteSelectedObject() {
        if (selectedObject && confirm(`Are you sure you want to delete the object "${selectedObject.name}" ?`)) {
            objects = objects.filter(obj => obj !== selectedObject);
            selectedObject = null;
            updateControlPanelState();
            draw();
        }
    }


    rotationSlider.addEventListener('input', (e) => {
        if (selectedObject) {
            const newAngle = parseInt(e.target.value, 10);
            selectedObject.rotation = newAngle % 360; 
            rotationValueDisplay.textContent = selectedObject.rotation;
            draw();
        }
    });

    document.getElementById('set-room-size').addEventListener('click', () => {
        const width = parseFloat(document.getElementById('room-width').value);
        const height = parseFloat(document.getElementById('room-height').value);
        
        if (width >= 100 && height >= 100) {
            roomDimensionsCm = { width, height };
            
            updateScaleFactor();
            draw();
        } 
    });
    
    window.addEventListener('resize', () => {
        if (roomDimensionsCm.width > 0) {
            updateScaleFactor();
            draw();
        }
    });


    document.getElementById('cockpit-selector').addEventListener('change', (e) => {
        const selectedCockpit = e.target.value;
        const addButton = document.getElementById('add-cockpit-btn');
        addButton.disabled = !selectedCockpit;
    });

    document.getElementById('add-cockpit-btn').addEventListener('click', () => {
        const selector = document.getElementById('cockpit-selector');
        const selectedName = selector.value;
        const cockpit = allCockpits.find(c => c.name === selectedName);

        if (cockpit) {
            addObject(
                cockpit.name,
                cockpit.widthCm,
                cockpit.lengthCm, 
                'rgba(179, 27, 27, 0.7)' 
            );
        }
    });

    document.getElementById('add-object-btn').addEventListener('click', () => {
        const name = document.getElementById('object-name').value || 'Object';
        const width = parseFloat(document.getElementById('object-width').value);
        const height = parseFloat(document.getElementById('object-height').value);

        if (width >= 10 && height >= 10) {
            addObject(name, width, height, 'rgba(100, 100, 100, 0.7)'); 
        } 
    });
    
    deleteButton.addEventListener('click', deleteSelectedObject);

    exportButton.addEventListener('click', exportPlan);
    importFile.addEventListener('change', importPlan);


    document.getElementById('clear-all-btn').addEventListener('click', () => {
        if (confirm("Are you sure you want to clear everything?")) {
            objects = [];
            selectedObject = null;
            updateControlPanelState();
            draw();
        }
    });
    
    canvas.addEventListener('mousedown', handlePointerDown);
    canvas.addEventListener('mousemove', handlePointerMove);
    canvas.addEventListener('mouseup', handlePointerUp);
    canvas.addEventListener('mouseout', handlePointerUp); 

    canvas.addEventListener('touchstart', handlePointerDown);
    canvas.addEventListener('touchmove', handlePointerMove);
    canvas.addEventListener('touchend', handlePointerUp);

    canvas.addEventListener('selectstart', e => e.preventDefault());

    loadDataAndInit();
});