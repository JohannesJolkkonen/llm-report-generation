from qdrant_client import QdrantClient
from qdrant_client.models import PointStruct, VectorParams, Distance
import re
from decouple import config
from utils.openai_utils import get_embeddings

pattern = r"\d+\.\s\*\*.*?(?=\n\d+\.|\Z)"

client = QdrantClient(url=config("QDRANT_URL"), api_key=config("QDRANT_API_KEY"))


def create_collections():
    client.recreate_collection(
        collection_name="project_cases",
        vectors_config=VectorParams(size=1536, distance=Distance.COSINE),
    )
    client.recreate_collection(
        collection_name="testimonials",
        vectors_config=VectorParams(size=1536, distance=Distance.COSINE),
    )


def upload_project_cases():
    with open("data/projects/project_cases.txt", "r") as file:
        data = file.read()

    project_cases = [
        {
            "id": idx,
            "title": p.split("\n")[0],
            "description": "\n".join(p.split("\n")[1:]),
            "embedding": get_embeddings(p),
        }
        for idx, p in enumerate(re.findall(pattern, data, re.DOTALL))
    ]

    qdrant_points = [
        PointStruct(
            id=p["id"],
            vector=p["embedding"],
            payload={
                "title": p["title"].replace("**", "")[3:],
                "description": p["description"],
            },
        )
        for p in project_cases
    ]
    client.upsert(collection_name="project_cases", points=qdrant_points)


def upload_testimonials():
    with open("data/projects/testimonials.txt", "r") as file:
        data = file.read()

    testimonials = [
        {
            "id": idx,
            "company": p.split("\n")[1].split("**")[-1],
            "contact": p.split("\n")[2].split("**")[-1],
            "testimonial": p.split("\n")[3].split("**")[-1],
            "portrait": p.split("\n")[4].split(":")[-1].strip(),
            "embedding": get_embeddings(p),
        }
        for idx, p in enumerate(re.findall(pattern, data, re.DOTALL))
    ]
    for idx, p in enumerate(re.findall(pattern, data, re.DOTALL)):
        print(p.split("\n"))

    qdrant_points = [
        PointStruct(
            id=t["id"],
            vector=t["embedding"],
            payload={
                "company": t["company"],
                "contact": t["contact"],
                "testimonial": t["testimonial"],
                "portrait": t["portrait"],
            },
        )
        for t in testimonials
    ]
    client.upsert(collection_name="testimonials", points=qdrant_points)


def qdrant_search(query: str, collection: str, k: int = 5):
    query_embedding = get_embeddings(query)
    return client.search(
        query_vector=query_embedding,
        collection_name=collection,
        limit=k,
        with_payload=True,
    )


# create_collections()
# upload_project_cases()
# upload_testimonials()
