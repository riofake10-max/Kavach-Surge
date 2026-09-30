export interface BoundingBox {
  minLat: number;
  minLng: number;
  maxLat: number;
  maxLng: number;
}

export interface SatelliteLayerData {
  layerName: string;
  provider: string;
  resolutionM: number;
  lastObservationDate: string;
  ndwiWaterIndexRange: [number, number];
  landCoverClasses: { classId: number; name: string; manningRoughness: number; percentage: number }[];
  sampleGeoJson: GeoJSON.FeatureCollection;
}

export interface SatelliteProvider {
  getFloodExtentBaseline(bbox: BoundingBox): Promise<SatelliteLayerData>;
  getLandCover(bbox: BoundingBox): Promise<SatelliteLayerData>;
  getNDWI(bbox: BoundingBox): Promise<SatelliteLayerData>;
}

/**
 * MockSatelliteProvider (GEE-compatible layer - sample)
 * Bundled precomputed sample rasters & GeoJSON simulating Sentinel-1 SAR and Sentinel-2 optical outputs.
 */
export class MockSatelliteProvider implements SatelliteProvider {
  async getFloodExtentBaseline(bbox: BoundingBox): Promise<SatelliteLayerData> {
    return {
      layerName: 'Sentinel-1 SAR Coastal Inundation Baseline',
      provider: 'GEE-compatible layer (sample precomputed from COPERNICUS/S1_GRD)',
      resolutionM: 10,
      lastObservationDate: '2026-09-28 (Pass 127 ASCENDING)',
      ndwiWaterIndexRange: [-0.6, 0.72],
      landCoverClasses: [
        { classId: 1, name: 'Permanent Water / Marine', manningRoughness: 0.02, percentage: 42 },
        { classId: 2, name: 'Tidal Mudflats / Mangrove', manningRoughness: 0.07, percentage: 18 },
        { classId: 3, name: 'Paddy / Agriculture', manningRoughness: 0.038, percentage: 26 },
        { classId: 4, name: 'Dense Coastal Settlement', manningRoughness: 0.08, percentage: 14 },
      ],
      sampleGeoJson: {
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            properties: { waterType: 'tidal_inundation_baseline', roughness: 0.045 },
            geometry: {
              type: 'Polygon',
              coordinates: [
                [
                  [bbox.minLng, bbox.minLat],
                  [bbox.maxLng, bbox.minLat],
                  [bbox.maxLng, bbox.minLat + 0.08],
                  [bbox.minLng, bbox.minLat + 0.04],
                  [bbox.minLng, bbox.minLat],
                ],
              ],
            },
          },
        ],
      },
    };
  }

  async getLandCover(bbox: BoundingBox): Promise<SatelliteLayerData> {
    return this.getFloodExtentBaseline(bbox);
  }

  async getNDWI(bbox: BoundingBox): Promise<SatelliteLayerData> {
    return this.getFloodExtentBaseline(bbox);
  }
}

/**
 * Real Google Earth Engine Provider Stub
 * 
 * ARCHITECTURE FOR PRODUCTION WIRING:
 * 1. Deploy an authenticated Express/FastAPI proxy on Cloud Run.
 * 2. Configure GCP Service Account with role `roles/earthengine.writer`.
 * 3. In the proxy, authenticate via `ee.Initialize(credentials)` and export:
 *    - Sentinel-1 GRD SAR backscatter thresholding (VH polarisation for floodwater)
 *    - Copernicus Global Land Cover (100m) for dynamic Manning roughness parameterization
 *    - SRTM / FABDEM high-resolution digital elevation models.
 * 4. The proxy returns serialized GeoJSON or XYZ Map Tiles for Leaflet.
 */
export class GeeProvider implements SatelliteProvider {
  private apiEndpoint: string;

  constructor(endpoint: string = '/api/gee') {
    this.apiEndpoint = endpoint;
  }

  async getFloodExtentBaseline(bbox: BoundingBox): Promise<SatelliteLayerData> {
    const res = await fetch(`${this.apiEndpoint}/flood-extent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bbox, collection: 'COPERNICUS/S1_GRD' }),
    });
    if (!res.ok) throw new Error('GEE Service unavailable');
    return res.json();
  }

  async getLandCover(bbox: BoundingBox): Promise<SatelliteLayerData> {
    const res = await fetch(`${this.apiEndpoint}/landcover`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bbox, collection: 'ESA/WorldCover/v200' }),
    });
    if (!res.ok) throw new Error('GEE Service unavailable');
    return res.json();
  }

  async getNDWI(bbox: BoundingBox): Promise<SatelliteLayerData> {
    const res = await fetch(`${this.apiEndpoint}/ndwi`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bbox, collection: 'COPERNICUS/S2_SR_HARMONIZED' }),
    });
    if (!res.ok) throw new Error('GEE Service unavailable');
    return res.json();
  }
}
