import { useState, useEffect } from 'react';
import Image from 'next/image';
import { formatPrice } from '../lib/utils';
import AddToCartForm from './product/AddToCartForm';

export default function ProductDetails({ product }) {
    const [selectedOptions, setSelectedOptions] = useState({});
    const [allOptionsSelected, setAllOptionsSelected] = useState(false);

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
            console.log('Product Attributes:', product.attributes.map(attr => ({ id: attr.id, name: attr.name })));
        }
    }, [product.attributes]);

    if (!product) return null;

    return (
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
                <h1 className="text-3xl font-bold tracking-tight text-black">{product.name}</h1>
                <div className="mt-3">
                    <p className="text-3xl tracking-tight text-black">{formatPrice(product.price)}</p>
                </div>
                <div className="mt-6">
                    <h3 className="sr-only">Description</h3>
                    <div className="space-y-6 text-base text-black" dangerouslySetInnerHTML={{ __html: product.description }} />
                </div>

                {/* Product Options */}
                <AddToCartForm product={product} />

                {/* Trust Badges Section */}
            </div>
        </div>
    );
}
