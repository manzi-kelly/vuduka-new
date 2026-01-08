import React, { useState, useEffect, useRef, useCallback } from 'react';
import { FaRoute, FaRoad, FaLocationArrow, FaExclamationTriangle } from 'react-icons/fa';

// Function to draw pickup and dropoff markers as points
const drawMarkers = (graphicsLayerRef, map, pickupCoords, dropoffCoords, pickupLocation, dropoffLocation) => {
  console.log('drawMarkers called with:', { pickupCoords, dropoffCoords, pickupLocation, dropoffLocation });
  if (!map || !graphicsLayerRef || !pickupCoords || !dropoffCoords) return { pickup: null, dropoff: null };

  const Graphic = window.__esri__.Graphic;
  const Point = window.__esri__.Point;
  const SimpleMarkerSymbol = window.__esri__.SimpleMarkerSymbol;

  // Create pickup point
  const pickupPoint = new Point({
    longitude: pickupCoords.lat,
    latitude: pickupCoords.lng
  });

  const pickupSymbol = new SimpleMarkerSymbol({
    style: 'circle',
    color: '#10b981',
    size: '12px',
    outline: {
      color: [255, 255, 255, 1],
      width: 2
    }
  });

  const pickupGraphic = new Graphic({
    geometry: pickupPoint,
    symbol: pickupSymbol,
    popupTemplate: {
      title: '🚗 Pickup',
      content: `<div class="p-2"><span class="text-sm">${pickupLocation}</span></div>`
    }
  });

  graphicsLayerRef.add(pickupGraphic);

  // Create dropoff point
  const dropoffPoint = new Point({
    longitude: dropoffCoords.lat,
    latitude: dropoffCoords.lng
  });

  const dropoffSymbol = new SimpleMarkerSymbol({
    style: 'circle',
    color: '#ef4444',
    size: '12px',
    outline: {
      color: [255, 255, 255, 1],
      width: 2
    }
  });

  const dropoffGraphic = new Graphic({
    geometry: dropoffPoint,
    symbol: dropoffSymbol,
    popupTemplate: {
      title: '🎯 Dropoff',
      content: `<div class="p-2"><span class="text-sm">${dropoffLocation}</span></div>`
    }
  });

  graphicsLayerRef.add(dropoffGraphic);

  return { pickup: pickupGraphic, dropoff: dropoffGraphic };
};

// Function to draw route as polyline
const drawRoute = (graphicsLayerRef, map, routePaths) => {
  if (!map || !graphicsLayerRef || !routePaths) return null;

  const Graphic = window.__esri__.Graphic;
  const Polyline = window.__esri__.Polyline;
  const SimpleLineSymbol = window.__esri__.SimpleLineSymbol;

  console.log('drawRoute paths:', routePaths);
  const route = routePaths[0];
  console.log('drawRoute route:', route);
  // routePaths is expected to be an array of [lng, lat] coordinate pairs
  const polyline = new Polyline({
    paths:  route
  });

  const lineSymbol = new SimpleLineSymbol({
    color: '#3b82f6',
    width: 4,
    style: 'solid'
  });

  const graphic = new Graphic({
    geometry: polyline,
    symbol: lineSymbol
  });

  graphicsLayerRef.add(graphic);

  return graphic;
};

// Main Map Component
const MapComponent = ({ 
  pickupLocation, 
  dropoffLocation,
  pickupCoords,
  dropoffCoords,
  routeInfo
}) => {
  const mapRef = useRef(null);
  const graphicsLayerRef = useRef(null);
  
  const [map, setMap] = useState(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [setRouteInfo] = useState(null);
  const [error, setError] = useState(null);

  console.log('MapComponent render:', { pickupCoords, dropoffCoords, routeInfo: routeInfo });

  // Display route info from props
  const displayRouteInfo =  routeInfo;

  // Extract distance and time for display
  const routeDistance = displayRouteInfo?.distanceKm || displayRouteInfo?.distance;
  const routeTime = displayRouteInfo?.timeMinutes || displayRouteInfo?.time;

  // Update map when coordinates or route info changes
  useEffect(() => {
    if (!map || !mapLoaded || !pickupCoords || !dropoffCoords || !graphicsLayerRef.current) return;

    try {
      // Clear previous graphics
      graphicsLayerRef.current.removeAll();

     

      // Draw route if available
      if (routeInfo && routeInfo.paths) {
        drawRoute(graphicsLayerRef.current, map, routeInfo.paths);
        // Draw markers
        drawMarkers(graphicsLayerRef.current, map, pickupCoords, dropoffCoords, pickupLocation, dropoffLocation);
        // Set internal route info for display
        const routeDetails = {
          distance: routeInfo.distanceKm || routeInfo.distance,
          time: routeInfo.timeMinutes || routeInfo.time,
          isAccurate: routeInfo.isAccurate || false
        };
        //setRouteInfo(routeDetails);
      } else {
        setRouteInfo(null);
      }

      // Fit map to show all elements
      //if (graphicsLayerRef.current.graphics.length > 0) {
      //  map.goTo(graphicsLayerRef.current.graphics);
      //}
    } catch (err) {
      setError('Failed to update map');
      console.error('Map update error:', err);
    }
  }, [map, mapLoaded, pickupCoords, dropoffCoords, routeInfo, pickupLocation, dropoffLocation]);

  // Initialize ArcGIS MapView
  useEffect(() => {
    if (!mapRef.current || mapLoaded) return;

    let view;
    let graphicsLayer;

    const initializeMap = async () => {
      try {
        // Dynamically import ArcGIS modules and CSS
        await import('@arcgis/core/assets/esri/themes/light/main.css');
        const [
          MapModule,
          MapViewModule,
          GraphicsLayerModule,
          GraphicModule,
          PointModule,
          PolylineModule,
          SimpleMarkerSymbolModule,
          SimpleLineSymbolModule
        ] = await Promise.all([
          import('@arcgis/core/Map'),
          import('@arcgis/core/views/MapView'),
          import('@arcgis/core/layers/GraphicsLayer'),
          import('@arcgis/core/Graphic'),
          import('@arcgis/core/geometry/Point'),
          import('@arcgis/core/geometry/Polyline'),
          import('@arcgis/core/symbols/SimpleMarkerSymbol'),
          import('@arcgis/core/symbols/SimpleLineSymbol')
        ]);

        const Map = MapModule.default || MapModule.Map || MapModule;
        const MapView = MapViewModule.default || MapViewModule.MapView || MapViewModule;
        const GraphicsLayer = GraphicsLayerModule.default || GraphicsLayerModule.GraphicsLayer || GraphicsLayerModule;
        const Graphic = GraphicModule.default || GraphicModule.Graphic || GraphicModule;
        const Point = PointModule.default || PointModule.Point || PointModule;
        const Polyline = PolylineModule.default || PolylineModule.Polyline || PolylineModule;
        const SimpleMarkerSymbol = SimpleMarkerSymbolModule.default || SimpleMarkerSymbolModule.SimpleMarkerSymbol || SimpleMarkerSymbolModule;
        const SimpleLineSymbol = SimpleLineSymbolModule.default || SimpleLineSymbolModule.SimpleLineSymbol || SimpleLineSymbolModule;

        // Expose some constructors for other helper functions
        window.__esri__ = {
          Graphic,
          Point,
          Polyline,
          SimpleMarkerSymbol,
          SimpleLineSymbol
        };

        const mapInstance = new Map({ basemap: 'streets-vector' });

        view = new MapView({
          container: mapRef.current,
          map: mapInstance,
          center: [30.0588, -1.9441],
          zoom: 14
        });

        graphicsLayer = new GraphicsLayer();
        mapInstance.add(graphicsLayer);
        graphicsLayerRef.current = graphicsLayer;

        // wait for view to be ready
        await view.when();

        setMap(view);
        setMapLoaded(true);
        console.log('ArcGIS map initialized successfully');
      } catch (error) {
        console.error('ArcGIS map initialization failed:', error);
      }
    };

    initializeMap();

    return () => {
      try {
        if (view) {
          view.container = null;
          view.destroy && view.destroy();
        }
      } catch (err) {
        console.warn('Error destroying ArcGIS view', err);
      }
    };
  }, [mapLoaded]);

  // Show placeholder if no coordinates provided
  if (!pickupCoords || !dropoffCoords) {
    return (
      <div className="h-64 md:h-96 bg-gray-100 rounded-xl flex items-center justify-center border-2 border-dashed border-gray-300">
        <div className="text-center p-8">
          <FaRoute className="text-gray-400 text-4xl mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-600 mb-2">Route Preview</h3>
          <p className="text-gray-500 text-sm max-w-xs">
            Enter both pickup and dropoff locations to see the route
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-96 md:h-[500px] bg-gray-100 rounded-xl overflow-hidden relative shadow-lg border border-gray-200">
      {/* Error Display */}
      {error && (
        <div className="absolute top-4 left-4 right-4 bg-yellow-50 border border-yellow-200 rounded-lg p-4 z-10">
          <div className="flex items-center">
            <FaExclamationTriangle className="text-yellow-600 mr-3 flex-shrink-0" />
            <span className="text-yellow-700 text-sm font-medium">{error}</span>
          </div>
        </div>
      )}
      
      {/* Map Container */}
      <div ref={mapRef} className="w-full h-full" />
      
      {/* Route Information Panel */}
      <div className="absolute bottom-4 left-4 bg-white px-4 py-3 rounded-lg shadow-md border border-gray-200 max-w-xs">
        <div className="text-sm font-medium text-gray-700 mb-2">Route Information</div>
        <div className="space-y-2 text-xs text-gray-600">
          <div className="flex items-center">
            <div className="w-3 h-3 bg-green-500 rounded-full mr-2 border border-white"></div>
            <span className="font-medium truncate">{pickupLocation}</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-red-500 rounded-full mr-2 border border-white"></div>
            <span className="font-medium truncate">{dropoffLocation}</span>
          </div>
          <div className="flex items-center">
            <div className="w-6 h-2 bg-blue-500 rounded mr-2"></div>
            <span className="font-medium">Route Path</span>
          </div>
          
          {displayRouteInfo && (
            <div className="pt-2 border-t border-gray-200 mt-2">
              <div className="grid grid-cols-2 gap-2 text-green-600 font-medium">
                <div className="flex items-center">
                  <FaRoad className="mr-1 text-xs" />
                  <span>{routeDistance?.toFixed?.(1) || routeDistance} km</span>
                </div>
                <div className="flex items-center">
                  <FaRoute className="mr-1 text-xs" />
                  <span>{routeTime} min</span>
                </div>
              </div>
              {!displayRouteInfo.isAccurate && displayRouteInfo.isAccurate !== undefined && (
                <div className="text-xs text-yellow-600 mt-1 flex items-center">
                  <FaExclamationTriangle className="mr-1" />
                  Approximate route
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MapComponent;