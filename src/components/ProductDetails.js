import { useState, useEffect } from 'react';
import Image from 'next/image';
import { formatPrice } from '../lib/utils';
import { generateProductSchema } from '../utils/schema';
import Script from 'next/script';

export default function ProductDetails({ product }) {
    const [selectedOptions, setSelectedOptions] = useState({});
    const [allOptionsSelected, setAllOptionsSelected] = useState(false);
    const productSchema = generateProductSchema(product);

    const handleOptionChange = (name, value) => {
        const newOptions = { ...selectedOptions, [name]: value };
        setSelectedOptions(newOptions);

        // Check if all required options are selected
        const requiredOptions = product.attributes.filter(attr => attr.variation);
        const allSelected = requiredOptions.every(attr => newOptions[attr.name]);
        setAllOptionsSelected(allSelected);
    };

    useEffect(() => {
        if (product.attributes) {
        }
    }, [product.attributes]);

    if (!product) return null;

    return (
        <>
            <Script
                id="product-schema"
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }}
            />
            <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6 sm:py-24 lg:grid lg:max-w-7xl lg:grid-cols-2 lg:gap-x-8 lg:px-8">
                {/* Product Image */}
                <div className="lg:max-w-lg lg:self-end">
                    <div className="aspect-w-1 aspect-h-1 overflow-hidden rounded-lg">
                        <Image
                            src={product.images[0]?.src || '/placeholder.png'}
                            alt={product.name}
                            className="h-full w-full object-cover object-center"
                            width={product.images[0]?.width || 800}
                            height={product.images[0]?.height || 800}
                        />
                    </div>
                </div>

                {/* Product Info */}
                <div className="mt-10 px-4 sm:mt-16 sm:px-0 lg:mt-0">
                    <h2 className="text-3xl font-bold tracking-tight text-black">{product.name}</h2>
                    <div className="mt-3">
                        <p className="text-3xl tracking-tight text-black">{formatPrice(product.price)}</p>
                    </div>
                    <div className="mt-6">
                        <h3 className="sr-only">Description</h3>
                        <div className="space-y-6 text-base text-black" dangerouslySetInnerHTML={{ __html: product.description }} />
                    </div>

                    {/* Product Options */}
                    <div className="mt-6">
                        {product.attributes?.map((attribute) => {
                            return (
                            <div key={attribute.id} className="mb-4">
                                <label className="block text-sm font-medium text-black mb-2">
                                    {attribute.name}
                                </label>
                                <select
                                    value={selectedOptions[attribute.name] || ''}
                                    onChange={(e) => handleOptionChange(attribute.name, e.target.value)}
                                    className="mt-1 block w-full rounded-md border-gray-300 py-2 pl-3 pr-10 text-base focus:border-sky-500 focus:outline-none focus:ring-sky-500 sm:text-sm"
                                >
                                    <option value="">Select {attribute.name}</option>
                                    {attribute.options.map((option) => {
                                        return (
                                        <option key={`${attribute.id}-${option}`} value={option}>
                                            {option}
                                        </option>
                                    )})}
                                </select>
                            </div>
                        )})}
                    </div>

                    {/* Add to Cart Section */}
                    <div className="mt-10 flex w-full flex-col space-y-4">
                        {!allOptionsSelected && product.attributes?.length > 0 && (
                            <p className="text-red-500 text-sm mb-4">Please select all options before adding to cart</p>
                        )}
                        <button
                            disabled={!allOptionsSelected && product.attributes?.length > 0}
                            className={`w-full py-3 px-8 flex items-center justify-center rounded-md border border-transparent text-base font-medium text-white ${
                                !allOptionsSelected && product.attributes?.length > 0
                                    ? 'bg-gray-400 cursor-not-allowed'
                                    : 'bg-black hover:bg-gray-800'
                            }`}
                            onClick={() => console.log('Add to cart clicked')}
                        >
                            Add to Cart
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
}
