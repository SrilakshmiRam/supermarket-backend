const express=require('express')
const {open}=require('sqlite')
const sqlite3=require('sqlite3')
const cors=require('cors')

const app=express()
const path=require('path')

let db=null

app.use(cors(
    {
        origin:'http://localhost:3000',
        methods:['GET','POST','PUT','DELETE'],
        allowedHeaders:['Content-Type']
    }
))

app.use(express.json())

const dbPath=path.join(__dirname,'supermarket.db')

const initiateAndStartDatabaseServer=async()=>{
    try{
        db=await open({
            filename:dbPath,
            driver:sqlite3.Database
        })
        app.listen(3000,()=>{
            console.log('Server is running at http://localhost:3000/')
        })
    }catch (e){
        console.log(`DB Error : ${e.message}`)
        process.exit(1)
    }
}


initiateAndStartDatabaseServer()


app.get('/items',async(req,res)=>{
    try{
        const booksQuery=`select * from items;`
        const response=await db.all(booksQuery)
        res.status(200).json({response})
    }catch(e){
        console.log(`error: ${e.message}`)
        res.status(501).json('internal server error')
    }
})

app.post('/items', async(req,res)=>{
    const {name,categoryId,price,quantity}=req.body
    try{
        const insertQuery=`insert into items (name,category_id,price,quantity)
        values (?,?,?,?)`
        await db.run(insertQuery,[name,categoryId,price,quantity])
        res.status(201).json({message:'data inserted successfully'})
    }catch (e){
        console.error('Error while inserting', e)
        res.status(501).json({message:'Failed to Insert the data'})
    }
})

app.delete('/items/:id',async(req,res)=>{
    const {id}=req.params
    try{
        itemDeleteQuery=`delete from items where item_id=?;`
        await db.run(itemDeleteQuery,[id])
        res.status(201).json({message:'item deleted successfully'})
    }catch (e){
        console.error('Error while inserting', e)
        res.status(501).json({message:'Failed to Delete the item'})
    }
})


app.put('/items/:id', async (req, res) => {
    const { id } = req.params;
    const { name, categoryId, price, quantity } = req.body;

    try {
        const fieldsToUpdate = [];
        const values = [];

        if (name) {
            fieldsToUpdate.push('name = ?');
            values.push(name);
        }
        if (categoryId) {
            fieldsToUpdate.push('categoryId = ?');
            values.push(categoryId);
        }
        if (price) {
            fieldsToUpdate.push('price = ?');
            values.push(price);
        }
        if (quantity) {
            fieldsToUpdate.push('quantity = ?');
            values.push(quantity);
        }

        if (fieldsToUpdate.length === 0) {
            return res.status(400).json({ message: 'No fields to update' });
        }

        values.push(id);

        const itemUpdateQuery = `
            UPDATE items 
            SET ${fieldsToUpdate.join(', ')}
            WHERE item_id = ?;
        `;

        console.log('SQL Query:', itemUpdateQuery); // Debug: log SQL query
        console.log('Values:', values); // Debug: log values

        const result = await db.run(itemUpdateQuery, values);

        if (result.changes === 0) {
            return res.status(404).json({ message: 'Item not found' });
        }

        res.status(200).json({ message: 'Book updated successfully' });
    } catch (e) {
        console.error('Error while updating', e);
        res.status(500).json({ message: 'Failed to update the book' });
    }
});
