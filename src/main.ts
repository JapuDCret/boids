import { Engine, Render, Bodies, Body, Composite, Runner } from 'matter-js';

const main = () => {
	// create an engine
	const engine = Engine.create({
		gravity: { scale: 0 },
	});

	// create a renderer
	const render = Render.create({
		canvas: document.getElementById('canvas') as HTMLCanvasElement,
		engine: engine,
		options: {
			wireframes: false,
			width: 1200,
			height: 600,
		},
	});

	const radius = 10;

	// create two boxes and a ground
	const reds: Matter.Body[] = [
		Bodies.circle(375, 200, radius),
		Bodies.circle(400, 200, radius),
		Bodies.circle(425, 200, radius),
		Bodies.circle(400, 175, radius),
		Bodies.circle(400, 225, radius),
		Bodies.circle(375, 225, radius),
		Bodies.circle(375, 175, radius),
		Bodies.circle(425, 225, radius),
		Bodies.circle(425, 175, radius),

		Bodies.circle(200, 175, radius),
	];
	const blues: Matter.Body[] = [
		Bodies.circle(225, 450, radius),
		Bodies.circle(250, 450, radius),
		Bodies.circle(275, 450, radius),
		Bodies.circle(225, 425, radius),
		Bodies.circle(250, 425, radius),
		Bodies.circle(275, 425, radius),
		Bodies.circle(225, 475, radius),
		Bodies.circle(250, 475, radius),
		Bodies.circle(275, 475, radius),
		Bodies.circle(300, 450, radius),

		Bodies.circle(400, 450, radius),
	];
	const top = Bodies.rectangle(400, 0, 2000, 1, { isStatic: true });
	const bottom = Bodies.rectangle(400, 600, 2000, 1, { isStatic: true });
	const left = Bodies.rectangle(0, 0, 1, 2000, { isStatic: true });
	const right = Bodies.rectangle(1200, 0, 1, 2000, { isStatic: true });

	const randomSpeedFactor = 0.00;

	reds.forEach((body) => {
		const x = (0.5 - Math.random()) * randomSpeedFactor;
		const y = (0.5 - Math.random()) * randomSpeedFactor;
		body.force = { x, y };
		body.render = {
			lineWidth: 3,
			strokeStyle: '#e63',
			visible: true,
		};
		body.friction = 0;
		body.frictionAir = 0;
		body.frictionStatic = 0.001;
		body.restitution = 1;
		body.inertia = 1000;
		body.inverseInertia = 1 / 1000;
	});
	blues.forEach((body) => {
		const x = (0.5 - Math.random()) * randomSpeedFactor;
		const y = (0.5 - Math.random()) * randomSpeedFactor;
		body.force = { x, y };
		body.render = {
			lineWidth: 3,
			strokeStyle: '#36e',
			visible: true,
		};
		body.friction = 0.01;
		body.frictionAir = 0.01;
		body.frictionStatic = 0.01;
		body.restitution = 1;
		body.inertia = 1000;
		body.inverseInertia = 1 / 1000;
	});

	// add all of the bodies to the world
	Composite.add(engine.world, [...reds, ...blues, top, bottom, left, right]);

	// run the renderer
	Render.run(render);

	// create runner
	const runner = Runner.create();

	// run the engine
	Runner.run(runner, engine);

	const updateAttractionalForce = (bodies: Matter.Body[]) => {
		const presenseGranularity = 10;
		const minColumn = 0;
		const maxColumn = render.bounds.max.x / presenseGranularity;
		const minRow = 0;
		const maxRow = render.bounds.max.y / presenseGranularity;

		const presenceGrid = new Array<Array<number>>(maxColumn + 1);
		for (let x=0; x < presenceGrid.length; x++) {
			presenceGrid[x] = new Array<number>(maxRow + 1);
			for (let y=0; y < presenceGrid[x].length; y++) {
				presenceGrid[x][y] = 0;
			}
		}

		const betweenBounds = (no: number, minBound: number, maxBound: number) => {
			return Math.min(Math.max(no, minBound), maxBound);
		};

		bodies.forEach((body) => {
			const x = betweenBounds(Math.floor(body.position.x / presenseGranularity), minColumn, maxColumn);
			const y = betweenBounds(Math.floor(body.position.y / presenseGranularity), minRow, maxRow);
			presenceGrid[x][y] += 1;
		});

		/*
		if (bodies.find((body) => body.id === blues[1].id)) {
			let blub = '';
			for (let x=0; x < presenceGrid.length; x++) {
				blub += presenceGrid[x].join(', ') + '\n';
			}
			console.log(blub);
		}
		*/

		const attractionalForce = 0.000003;

		bodies.forEach((body) => {
			const bodyX = betweenBounds(Math.floor(body.position.x / presenseGranularity), minColumn, maxColumn);
			const bodyY = betweenBounds(Math.floor(body.position.y / presenseGranularity), minRow, maxRow);

			/*
			if (body === blues[1]) {
				console.log('body.position = ', body.position)
			}
			*/
			for (let x=0; x < presenceGrid.length; x++) {
				for (let y=0; y < presenceGrid[x].length; y++) {
					let forceMultiplier = presenceGrid[x][y];
					if (forceMultiplier > ((x === bodyX && y === bodyY) ? 1 : 0)) {
						const position = { x: (maxColumn - x)*presenseGranularity, y: (maxRow - y)*presenseGranularity };
						const distance = Math.max(Math.sqrt(Math.pow(x - bodyX, 2) +  Math.pow(x - bodyX, 2)), 1);
						if (distance < 4) {
							forceMultiplier = forceMultiplier / Math.pow(4 - distance, 2);
						}
						const distanceX = Math.max(Math.abs(x - bodyX), 1);
						const distanceY = Math.max(Math.abs(y - bodyY), 1);
						const componentX = distanceX / distance;
						const componentY = distanceY / distance;
						const directionX = x > bodyX ? 1 : -1;
						const directionY = y > bodyY ? 1 : -1;
						const force = { x: directionX * attractionalForce * forceMultiplier * componentX, y: directionY * attractionalForce * forceMultiplier * componentY };
						/*if (body === blues[1]) {
							console.log('forceMultiplier = ', forceMultiplier);
							console.log('position = ', position);
							console.log('distanceX = ', distanceX);
							console.log('distanceY = ', distanceY);
							console.log('force = ', force);
						}*/
						Body.applyForce(body, position, force);
					}
				}
			}

			/*
			const leftPosition = { x: Math.max(x - 1, minColumn), y };
			if (presenceGrid[leftPosition.x][leftPosition.y] > 0) {// is a Blue boid left of us?
				const forceMultiplier = presenceGrid[leftPosition.x][leftPosition.y];
				const position = { x: leftPosition.x*presenseGranularity, y: leftPosition.y*presenseGranularity }
				Body.applyForce(body, position, { x: attractionalForce * forceMultiplier, y: 0 });
			}
			const rightPosition = { x: Math.min(x + 1, maxColumn), y };
			if (presenceGrid[rightPosition.x][rightPosition.y] > 0) {
				const forceMultiplier = presenceGrid[rightPosition.x][rightPosition.y];
				const position = { x: rightPosition.x*presenseGranularity, y: rightPosition.y*presenseGranularity }
				Body.applyForce(body, position, { x: attractionalForce * forceMultiplier, y: 0 });
			}
			const topPosition = { x, y: Math.max(y - 1, minRow) };
			if (presenceGrid[topPosition.x][topPosition.y] > 0) {
				const forceMultiplier = presenceGrid[topPosition.x][topPosition.y];
				const position = { x: topPosition.x*presenseGranularity, y: topPosition.y*presenseGranularity }
				Body.applyForce(body, position, { x: 0, y: attractionalForce * forceMultiplier });
			}
			const bottomPosition = { x, y: Math.min(y + 1, maxRow) };
			if (presenceGrid[bottomPosition.x][bottomPosition.y] > 0) {
				const forceMultiplier = presenceGrid[bottomPosition.x][bottomPosition.y];
				const position = { x: bottomPosition.x*presenseGranularity, y: bottomPosition.y*presenseGranularity }
				Body.applyForce(body, position, { x: 0, y: attractionalForce * forceMultiplier });
			}
			*/
		});
	};

	const updateTime = 1000 / 60;

	const __updateAttractionalForce = () => {
		console.log('---------- updating attractional force ----------');
		setTimeout(() => {
			updateAttractionalForce(reds);
			updateAttractionalForce(blues);

			__updateAttractionalForce();
		}, updateTime);
	};

	__updateAttractionalForce();
};

window.onload = (e) => {
	main();
};