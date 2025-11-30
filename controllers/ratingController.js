const Rating = require('../models/Rating');
const Order = require('../models/Order');
const Chef = require('../models/Chef');

exports.submitRating = async (req, res) => {
    console.log("Tentative de notation par:", req.user.id);
    console.log("Body:", req.body);

    if (req.user.role !== 'CLIENT') {
        return res.status(403).json({ message: 'Seuls les clients peuvent soumettre des notes.' });
    }
    
    const { orderId, notes, commentaire } = req.body;

    try {
        // Compat: l'ordre stocke userId/chefId dans le modèle actuel
        const order = await Order.findOne({
            _id: orderId,
            $or: [{ user: req.user.id }, { userId: req.user.id }]
        });
        
        if (!order) {
            return res.status(404).json({ message: 'Commande introuvable ou ne vous appartient pas.' });
        }
        
        if (order.statut !== 'DELIVERED') {
            return res.status(400).json({ message: `Impossible de noter: La commande est ${order.statut} (doit être DELIVERED)` });
        }

        if (order.rating) {
             return res.status(400).json({ message: 'Cette commande a déjà été notée.' });
        }

        const noteValues = Object.values(notes).filter(n => typeof n === 'number');
        if (noteValues.length === 0) {
            return res.status(400).json({ message: 'Aucune note valide fournie.' });
        }
        const moyenneGlobale = noteValues.reduce((sum, n) => sum + n, 0) / noteValues.length;

        const chefId = order.chef || order.chefId;
        const rating = await Rating.create({
            user: req.user.id,
            chef: chefId,
            order: order._id,
            notes,
            commentaire,
            moyenneGlobale: parseFloat(moyenneGlobale.toFixed(2))
        });
        
        order.rating = rating._id;
        await order.save();
        
        const chefRatings = await Rating.find({ chef: chefId });
        if (chefRatings.length > 0) {
            const totalRatingSum = chefRatings.reduce((sum, r) => sum + r.moyenneGlobale, 0);
            const newChefAverage = totalRatingSum / chefRatings.length;
            
            await Chef.findByIdAndUpdate(chefId, {
                rating: parseFloat(newChefAverage.toFixed(2)),
                totalRatings: chefRatings.length
            });
        }

        res.status(201).json(rating);

    } catch (error) {
        console.error("ERREUR NOTATION:", error);
        res.status(500).json({ 
            message: 'Erreur serveur lors de la notation', 
            details: error.message,
            stack: error.stack
        });
    }
};
