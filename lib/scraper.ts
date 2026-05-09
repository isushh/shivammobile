/**
 * Scraper Utility - Mock function for fetching product specs
 * In production, this would connect to actual scraping services or APIs
 */

export interface ProductSpecs {
    processor: string;
    ram: string;
    battery: string;
    camera: string;
    storage?: string;
    display?: string;
}

/**
 * Mock function to fetch product specifications
 * Simulates scraping data from manufacturer websites
 */
export async function fetchProductSpecs(productName: string): Promise<ProductSpecs> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 800));

    // Mock specs based on common product patterns
    const specs: ProductSpecs = {
        processor: "Octa-core Processor",
        ram: "8GB RAM",
        battery: "4500mAh Battery",
        camera: "50MP Triple Camera",
        storage: "256GB Storage",
        display: "6.7\" Super AMOLED Display"
    };

    // Customize based on product name patterns
    const lowerName = productName.toLowerCase();

    if (lowerName.includes("iphone") || lowerName.includes("apple")) {
        specs.processor = "A17 Pro Bionic Chip";
        specs.ram = "8GB RAM";
        specs.battery = "4000mAh Battery";
        specs.camera = "48MP Main + 12MP Ultra Wide";
        specs.display = "6.1\" Super Retina XDR";
    } else if (lowerName.includes("samsung") || lowerName.includes("galaxy")) {
        specs.processor = "Snapdragon 8 Gen 3";
        specs.ram = "12GB RAM";
        specs.battery = "5000mAh Battery";
        specs.camera = "200MP Quad Camera";
        specs.display = "6.8\" Dynamic AMOLED 2X";
    } else if (lowerName.includes("pixel")) {
        specs.processor = "Google Tensor G3";
        specs.ram = "12GB RAM";
        specs.battery = "5050mAh Battery";
        specs.camera = "50MP Dual Camera";
        specs.display = "6.7\" LTPO OLED";
    } else if (lowerName.includes("oneplus")) {
        specs.processor = "Snapdragon 8 Gen 2";
        specs.ram = "16GB RAM";
        specs.battery = "5500mAh Battery";
        specs.camera = "50MP Triple Camera";
        specs.display = "6.78\" Fluid AMOLED";
    }

    return specs;
}

/**
 * Generate a product slug from name
 */
export function generateSlug(name: string): string {
    return name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
}